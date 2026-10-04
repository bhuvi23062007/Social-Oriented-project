import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ReportsModule } from './reports/reports.module';
import { RedisModule } from './redis/redis.module';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';
import { StorageModule } from './storage/storage.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RewardsModule } from './rewards/rewards.module';
import { CleaningTeamsModule } from './cleaning-teams/cleaning-teams.module';
import { MessagesService } from './messages/messages.service';
import { MessagesModule } from './messages/messages.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, ReportsModule, RedisModule, RabbitMQModule, StorageModule, NotificationsModule, RewardsModule, CleaningTeamsModule, MessagesModule],
  controllers: [AppController],
  providers: [MessagesService],
})
export class AppModule {}