import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';
import { PrismaService } from '../prisma/prisma.service';

interface ReportResolvedEvent {
  reportId: string;
  reporterId: string;
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

  private async handleReward(data: ReportResolvedEvent) {
    const existingReward = await this.prisma.rewardTransaction.findUnique({
      where: { reportId: data.reportId },
    });

    if (existingReward) {
      this.logger.warn(`Reward already exists for report ${data.reportId}`);
      return;
    }

    await this.prisma.$transaction([
      this.prisma.rewardTransaction.create({
        data: {
          userId: data.reporterId,
          reportId: data.reportId,
          points: data.points,
          reason: 'Report resolved',
        },
      }),
      this.prisma.user.update({
        where: { id: data.reporterId },
        data: { points: { increment: data.points } },
      }),
    ]);

    this.logger.log(`[Reward Worker] Granted ${data.points} points to ${data.reporterId}`);
  }

  private async handleNotification(data: ReportResolvedEvent) {
    await this.prisma.notification.create({
      data: {
        userId: data.reporterId,
        message: `Your report ${data.reportId} was resolved. You earned ${data.points} points.`,
      },
    });

    this.logger.log(`[Notification Worker] Created notification for ${data.reporterId}`);
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }
}