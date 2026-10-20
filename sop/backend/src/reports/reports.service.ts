import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { ReportStatus, WasteType, ImageType } from '@prisma/client';
import {
  WASTE_POINTS,
  NEARBY_RADIUS_KM,
  ON_SITE_RADIUS_KM,
  MIN_JOB_MINUTES,
  CLEANER_ONLINE_MINUTES,
  distanceKm,
} from './waste.constants';

const REPORTER_SELECT = { id: true, name: true, email: true };

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private rabbitMQService: RabbitMQService,
  ) {}

  async create(
    userId: string,
    dto: { description: string; latitude: number; longitude: number; imageUrl?: string; wasteType?: WasteType },
  ) {
    const report = await this.prisma.report.create({
      data: {
        description: dto.description,
        latitude: dto.latitude,
        longitude: dto.longitude,
        wasteType: dto.wasteType ?? WasteType.LITTER,
        reporterId: userId,
        images: dto.imageUrl ? { create: [{ url: dto.imageUrl }] } : undefined,
        statusHistory: {
          create: [{ status: ReportStatus.PENDING, note: 'Report created' }],
        },
      },
      include: { images: true, statusHistory: true },
    });

    
    await this.rabbitMQService.publish('report.created', {
      reportId: report.id,
      reporterId: report.reporterId,
    });

    return report;
  }

    // the cleaner's current self-accepted job (used to resume after closing the app)
  async findActive(userId: string) {
    const report = await this.prisma.report.findFirst({
      where: {
        status: { in: [ReportStatus.ACCEPTED, ReportStatus.IN_PROGRESS] },
        assignment: { cleanerId: userId },
      },
      include: { images: true, assignment: true, reporter: { select: { id: true, name: true } } },
    });
    if (!report) return { task: null };
    return {
      task: { ...report, onSiteMeters: ON_SITE_RADIUS_KM * 1000, minJobMinutes: MIN_JOB_MINUTES },
    };
  }

  // cleaner cancels their accepted job, it goes back to the open pool
  async release(reportId: string, cleanerId: string) {
    await this.prisma.$transaction(async (tx) => {
      const res = await tx.report.updateMany({
        where: {
          id: reportId,
          status: { in: [ReportStatus.ACCEPTED, ReportStatus.IN_PROGRESS] },
          assignment: { cleanerId },
        },
        data: { status: ReportStatus.PENDING },
      });
      if (res.count === 0) throw new BadRequestException('Nothing to cancel');

      await tx.assignment.delete({ where: { reportId } });
      await tx.reportStatusHistory.create({
        data: { reportId, status: ReportStatus.PENDING, note: 'Released by cleaner, open again' },
      });
    });
    await this.redisService.invalidateStats();
    return { ok: true };
  }
  
  findMyReports(userId: string) {
    return this.prisma.report.findMany({
      where: { reporterId: userId },
      include: {
        images: true,
        statusHistory: true,
        assignment: { include: { cleaner: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findAll() {
    return this.prisma.report.findMany({
      include: {
        images: true,
        statusHistory: true,
        reporter: { select: REPORTER_SELECT },
        assignment: {
          include: { cleaningTeam: true, cleaner: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Cleaner feed: open reports within radius of the cleaner's last known location
  async findOpen(userId: string) {
    const me = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!me || me.latitude == null || me.longitude == null) return [];
    const { latitude: lat, longitude: lng } = me;

    const reports = await this.prisma.report.findMany({
      where: { status: ReportStatus.PENDING, assignment: { is: null } },
      include: { images: true, reporter: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return reports
      .map((r) => ({ ...r, distanceKm: distanceKm(lat, lng, r.latitude, r.longitude) }))
      .filter((r) => r.distanceKm <= NEARBY_RADIUS_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  async updateLocation(userId: string, latitude: number, longitude: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { latitude, longitude, locationUpdatedAt: new Date() },
    });
    return { ok: true };
  }

  async findOne(id: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: { images: true, statusHistory: true, assignment: true },
    });
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  async updateStatus(reportId: string, status: ReportStatus, note?: string) {
    const report = await this.findOne(reportId);

    await this.prisma.reportStatusHistory.create({
      data: { reportId, status, note },
    });

    const updated = await this.prisma.report.update({
      where: { id: reportId },
      data: { status },
      include: { images: true, statusHistory: true },
    });

    if (status === ReportStatus.RESOLVED) {
      const points = WASTE_POINTS[report.wasteType];
      await this.redisService.addLeaderboardPoints(report.reporterId, points);
      await this.rabbitMQService.publish('report.resolved', {
        reportId: report.id,
        reporterId: report.reporterId,
        cleanerId: report.assignment?.cleanerId ?? null,
        points,
      });
    }
    await this.redisService.invalidateStats();

    return updated;
  }

  async assignTeam(reportId: string, cleaningTeamId: string) {
    await this.findOne(reportId);

    const assignment = await this.prisma.assignment.create({
      data: { reportId, cleaningTeamId },
    });

    await this.updateStatus(reportId, ReportStatus.ACCEPTED, 'Cleaning team assigned');

    return assignment;
  }

  async accept(reportId: string, cleanerId: string) {
    const cleaner = await this.prisma.user.findUnique({ where: { id: cleanerId } });
    const existing = await this.findOne(reportId);

    const ageMs = cleaner?.locationUpdatedAt ? Date.now() - cleaner.locationUpdatedAt.getTime() : Infinity;
    if (!cleaner || cleaner.latitude == null || cleaner.longitude == null || ageMs > CLEANER_ONLINE_MINUTES * 60_000) {
      throw new BadRequestException('Turn on location access to accept requests');
    }
    const km = distanceKm(cleaner.latitude, cleaner.longitude, existing.latitude, existing.longitude);
    if (km > NEARBY_RADIUS_KM) {
      throw new ForbiddenException('This request is outside your area');
    }

    await this.prisma.$transaction(async (tx) => {
      // lock this cleaner's row so two quick taps can't both pass the one-job check
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${cleanerId} FOR UPDATE`;

      const active = await tx.assignment.count({
        where: { cleanerId, report: { status: { in: [ReportStatus.ACCEPTED, ReportStatus.IN_PROGRESS] } } },
      });
      if (active > 0) throw new ForbiddenException('Finish your current task before accepting another');

      const claimed = await tx.report.updateMany({
        where: { id: reportId, status: ReportStatus.PENDING },
        data: { status: ReportStatus.ACCEPTED },
      });
      if (claimed.count === 0) throw new ConflictException('Report already taken');

      await tx.assignment.create({
        data: { reportId, cleanerId, cleaningTeamId: cleaner.cleaningTeamId ?? null },
      });
      await tx.reportStatusHistory.create({
        data: { reportId, status: ReportStatus.ACCEPTED, note: `Accepted by ${cleaner.name ?? 'cleaner'}` },
      });
    });

    const report = await this.findOne(reportId);
    await this.prisma.notification.create({
      data: { userId: report.reporterId, message: 'A cleaner accepted your report and is on the way.' },
    });
    await this.redisService.invalidateStats();
    return report;
  }

  async complete(
    reportId: string,
    userId: string,
    dto: { afterImageUrl: string; latitude: number; longitude: number },
  ) {
    const report = await this.findOne(reportId);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const a = report.assignment;

    const isMine = !!a && (a.cleanerId === userId || (!!user?.cleaningTeamId && a.cleaningTeamId === user.cleaningTeamId));
    if (!a || !isMine) throw new ForbiddenException('This task is not assigned to you');

    if (report.status !== ReportStatus.ACCEPTED && report.status !== ReportStatus.IN_PROGRESS) {
      throw new BadRequestException('Report is not in a completable state');
    }

    const km = distanceKm(dto.latitude, dto.longitude, report.latitude, report.longitude);
    if (km > ON_SITE_RADIUS_KM) {
      throw new ForbiddenException(`You must be at the spot to complete (you are ${Math.round(km * 1000)} m away)`);
    }

    if (Date.now() - a.assignedAt.getTime() < MIN_JOB_MINUTES * 60_000) {
      throw new BadRequestException(`Cleaning takes time. Complete at least ${MIN_JOB_MINUTES} min after accepting`);
    }

    // photo must be a fresh upload by this cleaner, usable once
    const key = `upload:${dto.afterImageUrl}`;
    if ((await this.redisService.get(key)) !== userId) {
      throw new BadRequestException('Take and upload a fresh photo of the cleaned spot');
    }

    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.report.updateMany({
        where: { id: reportId, status: { in: [ReportStatus.ACCEPTED, ReportStatus.IN_PROGRESS] } },
        data: { status: ReportStatus.CLEANING_COMPLETED },
      });
      if (claimed.count === 0) throw new ConflictException('Report already completed');

      await tx.reportImage.create({ data: { reportId, url: dto.afterImageUrl, type: ImageType.AFTER } });
      await tx.assignment.update({ where: { reportId }, data: { completedAt: new Date() } });
      await tx.reportStatusHistory.create({
        data: {
          reportId,
          status: ReportStatus.CLEANING_COMPLETED,
          note: 'Cleaning completed, awaiting admin verification',
        },
      });
    });

    await this.redisService.del(key);
    await this.redisService.invalidateStats();
    return this.findOne(reportId);
  }

  async findAssignedToMyTeam(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const or: any[] = [{ assignment: { cleanerId: userId } }];
    if (user?.cleaningTeamId) or.push({ assignment: { cleaningTeamId: user.cleaningTeamId } });

    return this.prisma.report.findMany({
      where: { OR: or },
      include: { images: true, statusHistory: true, assignment: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findAssignedToTeam(cleaningTeamId: string) {
    return this.prisma.report.findMany({
      where: { assignment: { cleaningTeamId } },
      include: { images: true, statusHistory: true, assignment: true },
    });
  }

  async computeStats() {
    const [total, pending, accepted, inProgress, cleaningCompleted, resolved, rejected] = await Promise.all([
      this.prisma.report.count(),
      this.prisma.report.count({ where: { status: ReportStatus.PENDING } }),
      this.prisma.report.count({ where: { status: ReportStatus.ACCEPTED } }),
      this.prisma.report.count({ where: { status: ReportStatus.IN_PROGRESS } }),
      this.prisma.report.count({ where: { status: ReportStatus.CLEANING_COMPLETED } }),
      this.prisma.report.count({ where: { status: ReportStatus.RESOLVED } }),
      this.prisma.report.count({ where: { status: ReportStatus.REJECTED } }),
    ]);
    return { total, pending, accepted, inProgress, cleaningCompleted, resolved, rejected };
  }
}