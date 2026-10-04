import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { CleaningTeamsService } from './cleaning-teams.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cleaning-teams')
export class CleaningTeamsController {
  constructor(private cleaningTeamsService: CleaningTeamsService) {}

  @Get()
  findAll() {
    return this.cleaningTeamsService.findAll();
  }

  @Roles('ADMIN')
  @Post()
  create(@Body('name') name: string) {
    return this.cleaningTeamsService.create(name);
  }
}