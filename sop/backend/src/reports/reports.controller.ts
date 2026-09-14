import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
    constructor(private reportsService: ReportsService) { }

    @Post()
    create(@Request() req: any, @Body() dto: CreateReportDto) {
        return this.reportsService.create(req.user.userId, dto);
    }

    @Get('mine')
    myReports(@Request() req: any) {
        return this.reportsService.findMyReports(req.user.userId);
    }

    @Get()
    allReports() {
        return this.reportsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.reportsService.findOne(id);
    }
}