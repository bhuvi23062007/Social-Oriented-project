import { IsString } from 'class-validator';

export class CompleteReportDto {
  @IsString()
  afterImageUrl: string;
}