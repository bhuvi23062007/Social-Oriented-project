import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  checkHealth() {
    return {
      status: 'ok',
      service: 'waste-management-backend',
      timestamp: new Date().toISOString(),
    };
  }
}