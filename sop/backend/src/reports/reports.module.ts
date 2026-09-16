import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';

@Module({
  imports: [RabbitMQModule],
  providers: [ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}