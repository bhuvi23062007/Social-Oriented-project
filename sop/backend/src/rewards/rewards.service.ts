import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RewardsService {
  constructor(private prisma: PrismaService) {}

  async findMine(userId: string) {
    const [history, user] = await Promise.all([
      this.prisma.rewardTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.findUnique({ where: { id: userId }, select: { points: true } }),
    ]);
    return { balance: user?.points ?? 0, history };
  }
}