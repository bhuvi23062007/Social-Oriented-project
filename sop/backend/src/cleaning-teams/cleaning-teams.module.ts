import { Module } from '@nestjs/common';
import { CleaningTeamsController } from './cleaning-teams.controller';
import { CleaningTeamsService } from './cleaning-teams.service';

@Module({
  controllers: [CleaningTeamsController],
  providers: [CleaningTeamsService],
})
export class CleaningTeamsModule {}