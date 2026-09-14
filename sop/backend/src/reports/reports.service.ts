import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

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
}