import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateReportDto {
  @IsString()
  description: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}