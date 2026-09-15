import { IsString } from 'class-validator';

export class AssignTeamDto {
  @IsString()
  cleaningTeamId: string;
}