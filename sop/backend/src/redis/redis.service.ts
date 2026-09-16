import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  constructor() {
    super({ host: 'localhost', port: 6379 });
  }

  onModuleDestroy() {
    this.disconnect();
  }

  async addLeaderboardPoints(userId: string, points: number) {
    await this.zincrby('leaderboard', points, userId);
  }

  async getTopLeaderboard(limit = 10) {
    return this.zrevrange('leaderboard', 0, limit - 1, 'WITHSCORES');
  }

  async getCachedStats() {
    const cached = await this.get('stats:dashboard');
    return cached ? JSON.parse(cached) : null;
  }

  async setCachedStats(stats: any, ttlSeconds = 60) {
    await this.set('stats:dashboard', JSON.stringify(stats), 'EX', ttlSeconds);
  }

  async invalidateStats() {
    await this.del('stats:dashboard');
  }
}