import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('rewards')
export class RewardsController {
  constructor(private rewardsService: RewardsService) {}

  @Get('mine')
  myRewards(@Request() req: any) {
    return this.rewardsService.findMine(req.user.userId);
  }
}