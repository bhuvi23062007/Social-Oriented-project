import { Controller, MessageEvent, Query, Sse, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable, filter, interval, map, merge } from 'rxjs';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(
    private events: EventsService,
    private jwt: JwtService,
  ) {}

  @Sse()
  stream(@Query('token') token: string): Observable<MessageEvent> {
    let userId: string;
    try {
      userId = this.jwt.verify(token).sub;
    } catch {
      throw new UnauthorizedException();
    }

    const live = this.events.bus.pipe(
      filter((e) => !e.userId || e.userId === userId),
      map((e) => ({ type: e.type, data: e.data ?? {} }) as MessageEvent),
    );
    const ping = interval(25000).pipe(map(() => ({ type: 'ping', data: {} }) as MessageEvent));

    return merge(live, ping);
  }
}