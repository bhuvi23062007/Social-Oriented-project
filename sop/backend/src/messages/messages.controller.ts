import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateMessageStatusDto } from './dto/update-message-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('messages')
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Roles('ADMIN')
  @Post()
  send(@Body() dto: SendMessageDto) {
    return this.messagesService.send(dto.cleanerId, dto.location, dto.body, dto.priority);
  }

  @Get('mine')
  myMessages(@Request() req: any) {
    return this.messagesService.findMine(req.user.userId);
  }

  @Roles('ADMIN')
  @Get()
  allMessages() {
    return this.messagesService.findAll();
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateMessageStatusDto) {
    return this.messagesService.updateStatus(id, dto.status);
  }
}