import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { RedisService } from '../redis/redis.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AssignTeamDto } from './dto/assign-team.dto';
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
    create(@Request() req: any, @Body() dto: CreateReportDto) {
        return this.reportsService.create(req.user.userId, dto);
    }

    @Get('mine')
    myReports(@Request() req: any) {
        return this.reportsService.findMyReports(req.user.userId);
    }

    @Get('leaderboard')
    getLeaderboard() {
        return this.redisService.getTopLeaderboard();
    }

    @Roles('ADMIN')
    @Get('admin/stats')
    async getStats() {
        const cached = await this.redisService.getCachedStats();
        if (cached) return cached;
        const stats = await this.reportsService.computeStats();
        await this.redisService.setCachedStats(stats);
        return stats;
    }

    @Roles('ADMIN')
    @Get()
    allReports() {
        return this.reportsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.reportsService.findOne(id);
    }

    @Roles('ADMIN')
    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
        return this.reportsService.updateStatus(id, dto.status, dto.note);
    }

    @Roles('ADMIN')
    @Post(':id/assign')
    assignTeam(@Param('id') id: string, @Body() dto: AssignTeamDto) {
        return this.reportsService.assignTeam(id, dto.cleaningTeamId);
    }

    @Get(':id/assigned')
    findAssignedToTeam(@Param('id') id: string) {
        return this.reportsService.findAssignedToTeam(id);
    }
}