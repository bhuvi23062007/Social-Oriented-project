import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(name: string, email: string, password: string) {
    const existing = await this.usersService.findByEmail(email);
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.usersService.createUser(name, email, passwordHash);

    return this.signToken(user.id, user.email, user.role);
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.signToken(user.id, user.email, user.role);
  }

  private signToken(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    return { access_token: this.jwtService.sign(payload) };
  }
}