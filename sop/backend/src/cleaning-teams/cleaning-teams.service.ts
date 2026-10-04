import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CleaningTeamsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.cleaningTeam.findMany({
      include: { members: { select: { id: true, name: true, email: true } } },
    });
  }

  create(name: string) {
    return this.prisma.cleaningTeam.create({ data: { name } });
  }
}