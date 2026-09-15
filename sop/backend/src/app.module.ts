import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ReportsModule } from './reports/reports.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, ReportsModule, RedisModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}