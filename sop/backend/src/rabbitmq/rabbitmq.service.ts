import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.ChannelModel;
  private channel: amqp.Channel;
  private logger = new Logger(RabbitMQService.name);
  private readonly exchange = 'waste_exchange';

  async onModuleInit() {
    this.connection = await amqp.connect('amqp://admin:pass123@localhost:5672');
    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange(this.exchange, 'topic', { durable: true });
    this.logger.log('RabbitMQ connected');

    await this.consume('report_created_queue', 'report.created', async (data) => {
      this.logger.log(`REPORT_CREATED received: ${JSON.stringify(data)}`);
    });

    await this.consume('reward_queue', 'report.resolved', async (data) => {
      this.logger.log(`[Reward Worker] Granting ${data.points} pts to ${data.reporterId}`);
      // later: write RewardTransaction row via Prisma
    });

    await this.consume('notification_queue', 'report.resolved', async (data) => {
      this.logger.log(`[Notification Worker] Notifying user ${data.reporterId} report resolved`);
      // later: create Notification row via Prisma
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

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }
}