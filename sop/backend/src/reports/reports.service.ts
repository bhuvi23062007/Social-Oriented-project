import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { StorageService } from '../storage/storage.service';
import { ReportStatus, ImageType } from '@prisma/client';

const POINTS_FOR_RESOLVED = 10;

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private rabbitMQService: RabbitMQService,
    private storageService: StorageService,
  ) {}

  async create(userId: string, dto: { description: string; latitude: number; longitude: number }, file?: any) {
    const imageUrl = file ? await this.storageService.upload(file, 'reports/before') : undefined;

    const report = await this.prisma.report.create({
      data: {
        description: dto.description,
        latitude: dto.latitude,
        longitude: dto.longitude,
        reporterId: userId,
        images: imageUrl ? { create: [{ url: imageUrl, type: ImageType.BEFORE }] } : undefined,
        statusHistory: { create: [{ status: ReportStatus.PENDING, note: 'Report created' }] },
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
      include: { images: true, statusHistory: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findAll() {
    return this.prisma.report.findMany({
      include: { images: true, statusHistory: true, reporter: true, assignment: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: { images: true, statusHistory: true, assignment: true },
    });

    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  async getAvailableReports() {
    return this.prisma.report.findMany({
      where: { status: ReportStatus.PENDING },
      include: { images: true, statusHistory: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async acceptReport(reportId: string, userId: string) {
    const report = await this.findOne(reportId);

    if (report.status !== ReportStatus.PENDING) {
      throw new BadRequestException('Report is no longer available');
    }

    const cleaner = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, cleaningTeamId: true },
    });

    if (!cleaner) throw new NotFoundException('Cleaning staff not found');
    if (cleaner.role !== 'CLEANING_STAFF') throw new ForbiddenException('Only cleaning staff can accept reports');
    if (!cleaner.cleaningTeamId) throw new BadRequestException('Cleaning staff is not assigned to a team');

    const assignment = await this.prisma.assignment.create({
      data: { reportId, cleaningTeamId: cleaner.cleaningTeamId },
    });

    await this.changeStatus(reportId, ReportStatus.ACCEPTED, 'Report accepted by cleaning staff');

    return assignment;
  }

  async startCleaning(reportId: string, userId: string) {
    await this.verifyCleanerAssignment(reportId, userId);
    return this.changeStatus(reportId, ReportStatus.IN_PROGRESS, 'Cleaning started');
  }

  async completeCleaning(reportId: string, userId: string, file?: any) {
  await this.verifyCleanerAssignment(reportId, userId);

  const report = await this.findOne(reportId);

  if (report.status !== ReportStatus.IN_PROGRESS) {
    throw new BadRequestException('Report must be in progress before completion');
  }

  if (!file) {
    throw new BadRequestException('After-cleaning image is required');
  }

  const imageUrl = await this.storageService.upload(file, 'reports/after');

  await this.prisma.reportImage.create({
    data: { reportId, url: imageUrl, type: ImageType.AFTER },
  });

  await this.prisma.assignment.update({
    where: { reportId },
    data: { completedAt: new Date() },
  });

  return this.changeStatus(reportId, ReportStatus.CLEANING_COMPLETED, 'Cleaning completed with after photo');
}

  async verifyCleaning(reportId: string) {
    const report = await this.findOne(reportId);

    if (report.status !== ReportStatus.CLEANING_COMPLETED) {
      throw new BadRequestException('Only completed cleanings can be verified');
    }

    return this.changeStatus(reportId, ReportStatus.RESOLVED, 'Cleaning verified by admin');
  }

  async rejectCleaning(reportId: string, note?: string) {
    const report = await this.findOne(reportId);

    if (report.status !== ReportStatus.CLEANING_COMPLETED) {
      throw new BadRequestException('Only completed cleanings can be rejected');
    }

    return this.changeStatus(reportId, ReportStatus.REJECTED, note ?? 'Cleaning rejected by admin');
  }

  async changeStatus(reportId: string, status: ReportStatus, note?: string) {
    const report = await this.findOne(reportId);

    if (report.status === status) {
      throw new BadRequestException(`Report is already ${status}`);
    }

    await this.prisma.reportStatusHistory.create({
      data: { reportId, status, note },
    });

    const updated = await this.prisma.report.update({
      where: { id: reportId },
      data: { status },
      include: { images: true, statusHistory: true, assignment: true },
    });

    if (status === ReportStatus.RESOLVED) {
      await this.handleReportResolved(report);
    }

    await this.redisService.invalidateStats();

    return updated;
  }

  private async verifyCleanerAssignment(reportId: string, userId: string) {
    const cleaner = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, cleaningTeamId: true },
    });

    if (!cleaner) throw new NotFoundException('Cleaning staff not found');
    if (cleaner.role !== 'CLEANING_STAFF') throw new ForbiddenException('Only cleaning staff can perform this action');

    const assignment = await this.prisma.assignment.findUnique({
      where: { reportId },
    });

    if (!assignment) throw new NotFoundException('Report is not assigned');

    if (assignment.cleaningTeamId !== cleaner.cleaningTeamId) {
      throw new ForbiddenException('This report is assigned to another cleaning team');
    }
  }

  private async handleReportResolved(report: { id: string; reporterId: string }) {
    await this.redisService.addLeaderboardPoints(report.reporterId, POINTS_FOR_RESOLVED);

    await this.rabbitMQService.publish('report.resolved', {
      reportId: report.id,
      reporterId: report.reporterId,
      points: POINTS_FOR_RESOLVED,
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