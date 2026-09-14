import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  createUser(name: string, email: string, passwordHash: string, role: Role = Role.CITIZEN) {
    return this.prisma.user.create({
      data: { name, email, passwordHash, role },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}