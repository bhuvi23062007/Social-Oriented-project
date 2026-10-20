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
import { WASTE_POINTS, NEARBY_RADIUS_KM, distanceKm } from './waste.constants';

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

    if (!cleaner || cleaner.latitude == null || cleaner.longitude == null) {
      throw new BadRequestException('Turn on location access to accept requests');
    }
    const km = distanceKm(cleaner.latitude, cleaner.longitude, existing.latitude, existing.longitude);
    if (km > NEARBY_RADIUS_KM) {
      throw new ForbiddenException('This request is outside your area');
    }

    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.report.updateMany({
        where: { id: reportId, status: ReportStatus.PENDING },
        data: { status: ReportStatus.ACCEPTED },
      });
      if (claimed.count === 0) throw new ConflictException('Report already taken');

      await tx.assignment.create({
        data: { reportId, cleanerId, cleaningTeamId: cleaner.cleaningTeamId ?? null },
      });
      await tx.reportStatusHistory.create({
        data: {
          reportId,
          status: ReportStatus.ACCEPTED,
          note: `Accepted by ${cleaner.name ?? 'cleaner'}`,
        },
      });
    });

    const report = await this.findOne(reportId);
    await this.prisma.notification.create({
      data: { userId: report.reporterId, message: 'A cleaner accepted your report and is on the way.' },
    });
    await this.redisService.invalidateStats();
    return report;
  }

  async complete(reportId: string, userId: string, afterImageUrl: string) {
    const report = await this.findOne(reportId);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const a = report.assignment;

    const isMine =
      !!a &&
      (a.cleanerId === userId || (!!user?.cleaningTeamId && a.cleaningTeamId === user.cleaningTeamId));
    if (!isMine) throw new ForbiddenException('This task is not assigned to you');

    if (report.status !== ReportStatus.ACCEPTED && report.status !== ReportStatus.IN_PROGRESS) {
      throw new BadRequestException('Report is not in a completable state');
    }

    await this.prisma.reportImage.create({
      data: { reportId, url: afterImageUrl, type: ImageType.AFTER },
    });
    await this.prisma.assignment.update({
      where: { reportId },
      data: { completedAt: new Date() },
    });

    return this.updateStatus(
      reportId,
      ReportStatus.CLEANING_COMPLETED,
      'Cleaning completed, awaiting admin verification',
    );
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