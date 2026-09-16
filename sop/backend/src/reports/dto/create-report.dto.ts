import { Type } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class CreateReportDto {
  @IsString()
  description: string;

  @Type(() => Number)
  @IsNumber()
  latitude: number;

  @Type(() => Number)
  @IsNumber()
  longitude: number;
} 