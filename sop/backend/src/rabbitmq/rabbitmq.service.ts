import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';
import { PrismaService } from '../prisma/prisma.service';
import {
  WASTE_LABELS,
  WASTE_POINTS,
  NEARBY_RADIUS_KM,
  CLEANER_ONLINE_MINUTES,
  distanceKm,
} from '../reports/waste.constants';

interface ReportCreatedEvent {
  reportId: string;
  reporterId: string;
}

interface ReportResolvedEvent {
  reportId: string;
  reporterId: string;
  cleanerId?: string | null;
  points: number;
}

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.ChannelModel;
  private channel: amqp.Channel;
  private logger = new Logger(RabbitMQService.name);
  private readonly exchange = 'waste_exchange';

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    this.connection = await amqp.connect('amqp://admin:pass123@localhost:5672');
    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange(this.exchange, 'topic', { durable: true });
    this.logger.log('RabbitMQ connected');

    await this.consume('report_created_queue', 'report.created', async (data) => {
      this.logger.log(`REPORT_CREATED received: ${JSON.stringify(data)}`);
    });

    await this.consume('nearby_cleaners_queue', 'report.created', async (data: ReportCreatedEvent) => {
      await this.handleNearbyCleaners(data);
    });

    await this.consume('reward_queue', 'report.resolved', async (data: ReportResolvedEvent) => {
      await this.handleReward(data);
    });

    await this.consume('notification_queue', 'report.resolved', async (data: ReportResolvedEvent) => {
      await this.handleNotification(data);
    });
  }

  async publish(routingKey: string, payload: any) {
    this.channel.publish(
      this.exchange,
      routingKey,
      Buffer.from(JSON.stringify(payload)),
      { persistent: true },
    );
  }

  async consume(queue: string, routingKey: string, handler: (msg: any) => Promise<void>) {
    await this.channel.assertQueue(queue, { durable: true });
    await this.channel.bindQueue(queue, this.exchange, routingKey);

    this.channel.consume(queue, async (msg) => {
      if (!msg) return;

      try {
        const data = JSON.parse(msg.content.toString());
        await handler(data);
        this.channel.ack(msg);
      } catch (err) {
        this.logger.error('Consumer error', err);
        this.channel.nack(msg, false, false);
      }
    });
  }

  // Notify only online cleaners within radius of the new report
  private async handleNearbyCleaners(data: ReportCreatedEvent) {
    const report = await this.prisma.report.findUnique({ where: { id: data.reportId } });
    if (!report) return;

    const since = new Date(Date.now() - CLEANER_ONLINE_MINUTES * 60_000);
    const cleaners = await this.prisma.user.findMany({
      where: {
        role: 'CLEANING_STAFF',
        latitude: { not: null },
        longitude: { not: null },
        locationUpdatedAt: { gte: since },
      },
      select: { id: true, latitude: true, longitude: true },
    });

    const nearby = cleaners
      .map((c) => ({
        id: c.id,
        km: distanceKm(c.latitude as number, c.longitude as number, report.latitude, report.longitude),
      }))
      .filter((c) => c.km <= NEARBY_RADIUS_KM);

    if (nearby.length === 0) {
      this.logger.log(`[Nearby Worker] No online cleaners within ${NEARBY_RADIUS_KM} km of report ${report.id}`);
      return;
    }

    const label = WASTE_LABELS[report.wasteType];
    const pts = WASTE_POINTS[report.wasteType];

    await this.prisma.notification.createMany({
      data: nearby.map((c) => ({
        userId: c.id,
        message: `New request ${c.km.toFixed(1)} km away: ${label} (+${pts} pts). Open New Requests to accept.`,
      })),
    });

    this.logger.log(`[Nearby Worker] Notified ${nearby.length} cleaner(s) for report ${report.id}`);
  }

  private async grantPoints(userId: string, reportId: string, points: number, reason: string) {
    const existing = await this.prisma.rewardTransaction.findUnique({
      where: { reportId_userId: { reportId, userId } },
    });

    if (existing) {
      this.logger.warn(`Reward already exists for report ${reportId} / user ${userId}`);
      return;
    }

    await this.prisma.$transaction([
      this.prisma.rewardTransaction.create({
        data: { userId, reportId, points, reason },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { points: { increment: points } },
      }),
    ]);

    this.logger.log(`[Reward Worker] Granted ${points} points to ${userId}`);
  }

  private async handleReward(data: ReportResolvedEvent) {
    await this.grantPoints(data.reporterId, data.reportId, data.points, 'Report resolved');
    if (data.cleanerId) {
      await this.grantPoints(data.cleanerId, data.reportId, data.points, 'Cleaning verified');
    }
  }

  private async handleNotification(data: ReportResolvedEvent) {
    await this.prisma.notification.create({
      data: {
        userId: data.reporterId,
        message: `Your report ${data.reportId.slice(0, 8)} was resolved. You earned ${data.points} points.`,
      },
    });

    if (data.cleanerId) {
      await this.prisma.notification.create({
        data: {
          userId: data.cleanerId,
          message: `Your cleaning on report ${data.reportId.slice(0, 8)} was verified. You earned ${data.points} points.`,
        },
      });
    }

    this.logger.log(`[Notification Worker] Notifications created for report ${data.reportId}`);
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }
}