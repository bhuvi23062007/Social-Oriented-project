import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessagePriority, MessageStatus } from '@prisma/client';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  send(cleanerId: string, location: string, body: string, priority?: MessagePriority) {
    return this.prisma.message.create({
      data: { cleanerId, location, body, priority: priority ?? MessagePriority.NORMAL },
    });
  }

  findMine(cleanerId: string) {
    return this.prisma.message.findMany({
      where: { cleanerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findAll() {
    return this.prisma.message.findMany({
      include: { cleaner: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  updateStatus(id: string, status: MessageStatus) {
    return this.prisma.message.update({ where: { id }, data: { status } });
  }
}