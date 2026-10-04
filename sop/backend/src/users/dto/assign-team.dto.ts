import { IsString } from 'class-validator';

export class AssignUserTeamDto {
  @IsString()
  cleaningTeamId: string;
}