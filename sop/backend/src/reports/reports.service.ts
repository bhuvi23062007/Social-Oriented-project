import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { ReportStatus } from '@prisma/client';

const POINTS_FOR_RESOLVED = 10;

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private rabbitMQService: RabbitMQService,
  ) { }

  async create(userId: string, dto: { description: string; latitude: number; longitude: number; imageUrl?: string }) {
    const report = await this.prisma.report.create({
      data: {
        description: dto.description,
        latitude: dto.latitude,
        longitude: dto.longitude,
        reporterId: userId,
        images: dto.imageUrl
          ? { create: [{ url: dto.imageUrl }] }
          : undefined,
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
      include: { images: true, statusHistory: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findAll() {
    return this.prisma.report.findMany({
      include: { images: true, statusHistory: true, reporter: true },
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

  async updateStatus(reportId: string, status: ReportStatus, note?: string) {
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
      include: { images: true, statusHistory: true },
    });

    if (status === ReportStatus.RESOLVED) {
      await this.handleReportResolved(report);
    }
    await this.redisService.invalidateStats();
    return updated;
  }
  private async handleReportResolved(report: { id: string; reporterId: string }) {
    await this.redisService.addLeaderboardPoints(report.reporterId, POINTS_FOR_RESOLVED);
    await this.rabbitMQService.publish('report.resolved', {
      reportId: report.id,
      reporterId: report.reporterId,
      points: POINTS_FOR_RESOLVED,
    });
  }
  async assignTeam(reportId: string, cleaningTeamId: string) {
    await this.findOne(reportId);
    const assignment = await this.prisma.assignment.create({
      data: { reportId, cleaningTeamId },
    });
    await this.updateStatus(reportId, ReportStatus.ASSIGNED, 'Cleaning team assigned');
    return assignment;
  }

  findAssignedToTeam(cleaningTeamId: string) {
    return this.prisma.report.findMany({
      where: { assignment: { cleaningTeamId } },
      include: { images: true, statusHistory: true, assignment: true },
    });
  }

  async computeStats() {
    const [total, pending, verified, assigned, inProgress, resolved, rejected] = await Promise.all([
      this.prisma.report.count(),
      this.prisma.report.count({ where: { status: ReportStatus.PENDING } }),
      this.prisma.report.count({ where: { status: ReportStatus.VERIFIED } }),
      this.prisma.report.count({ where: { status: ReportStatus.ASSIGNED } }),
      this.prisma.report.count({ where: { status: ReportStatus.IN_PROGRESS } }),
      this.prisma.report.count({ where: { status: ReportStatus.RESOLVED } }),
      this.prisma.report.count({ where: { status: ReportStatus.REJECTED } }),
    ]);
    return { total, pending, verified, assigned, inProgress, resolved, rejected };
  }
}