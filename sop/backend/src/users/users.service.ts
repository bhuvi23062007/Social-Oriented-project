import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  createUser(name: string, email: string, passwordHash: string, role: Role = Role.CITIZEN) {
    return this.prisma.user.create({ data: { name, email, passwordHash, role } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async getLeaderboard() {
    const cached = await this.redis.get('leaderboard');
    if (cached) return JSON.parse(cached);

    const users = await this.prisma.user.findMany({
      orderBy: { points: 'desc' },
      take: 10,
      select: { id: true, name: true, points: true },
    });

    await this.redis.set('leaderboard', JSON.stringify(users), 'EX', 60);
    return users;
  }
}