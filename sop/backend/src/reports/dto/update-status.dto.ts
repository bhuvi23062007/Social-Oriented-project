import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ReportStatus } from '@prisma/client';

export class UpdateStatusDto {
  @IsEnum(ReportStatus)
  status: ReportStatus;

  @IsOptional()
  @IsString()
  note?: string;
}