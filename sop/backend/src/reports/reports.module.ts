import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';
import { WasteClassifierService } from './waste-classifier.service';

@Module({
  imports: [RabbitMQModule],
  providers: [ReportsService, WasteClassifierService],
  controllers: [ReportsController],
})
export class ReportsModule {}