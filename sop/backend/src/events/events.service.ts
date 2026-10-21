import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

export interface AppEvent {
  userId?: string;
  type: string;
  data?: any;
}

@Injectable()
export class EventsService {
  readonly bus = new Subject<AppEvent>();

  emit(userId: string, type: string, data: any = {}) {
    this.bus.next({ userId, type, data });
  }

  broadcast(type: string, data: any = {}) {
    this.bus.next({ type, data });
  }
}