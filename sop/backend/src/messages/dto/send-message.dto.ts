import { IsString, IsEnum, IsOptional } from 'class-validator';
import { MessagePriority } from '@prisma/client';

export class SendMessageDto {
  @IsString()
  cleanerId: string;

  @IsString()
  location: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsEnum(MessagePriority)
  priority?: MessagePriority;
}