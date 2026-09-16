import { Body, Controller, Get, Param, Patch, Post, Request, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';
import { ReportsService } from './reports.service';
import { RedisService } from '../redis/redis.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(
    private reportsService: ReportsService,
    private redisService: RedisService,
  ) { }

  @Post()
  @Roles('CITIZEN')
  @UseInterceptors(FileInterceptor('image'))
  create(@Request() req: any, @Body() dto: CreateReportDto, @UploadedFile() file?: any) {
    return this.reportsService.create(req.user.userId, dto, file);
  }

  @Get('mine')
  @Roles('CITIZEN')
  myReports(@Request() req: any) {
    return this.reportsService.findMyReports(req.user.userId);
  }

  @Get('leaderboard')
  getLeaderboard() {
    return this.redisService.getTopLeaderboard();
  }

  @Get('available')
  @Roles('CLEANING_STAFF')
  getAvailableReports() {
    return this.reportsService.getAvailableReports();
  }

  @Post(':id/accept')
  @Roles('CLEANING_STAFF')
  acceptReport(@Param('id') id: string, @Request() req: any) {
    return this.reportsService.acceptReport(id, req.user.userId);
  }

  @Patch(':id/start')
  @Roles('CLEANING_STAFF')
  startCleaning(@Param('id') id: string, @Request() req: any) {
    return this.reportsService.startCleaning(id, req.user.userId);
  }

  @Post(':id/complete')
  @Roles('CLEANING_STAFF')
  @UseInterceptors(FileInterceptor('afterImage'))
  completeCleaning(@Param('id') id: string, @Request() req: any, @UploadedFile() file?: any) {
    return this.reportsService.completeCleaning(id, req.user.userId, file);
  }

  @Get('admin/stats')
  @Roles('ADMIN')
  async getStats() {
    const cached = await this.redisService.getCachedStats();
    if (cached) return cached;
    const stats = await this.reportsService.computeStats();
    await this.redisService.setCachedStats(stats);
    return stats;
  }

  @Get()
  @Roles('ADMIN')
  allReports() {
    return this.reportsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @Patch(':id/verify')
  @Roles('ADMIN')
  verifyCleaning(@Param('id') id: string) {
    return this.reportsService.verifyCleaning(id);
  }

  @Patch(':id/reject')
  @Roles('ADMIN')
  rejectCleaning(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.reportsService.rejectCleaning(id, dto.note);
  }
}