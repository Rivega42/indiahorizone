import { Body, Controller, Headers, HttpCode, HttpStatus, Ip, Post } from '@nestjs/common';

import { RegisterDto } from './dto/register.dto';
import { AuthService } from './services/auth.service';

import type { RegisterResponse } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register
   *
   * Body: { email, password, role? }
   * Returns 201 + { userId, email, role } или 409 если email занят.
   *
   * Rate-limit: 5 попыток / 15 мин на IP (через throttler #221).
   * Декоратор будет добавлен после реализации throttler в #221.
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
    @Ip() ip: string,
    @Headers('x-forwarded-for') xForwardedFor?: string,
  ): Promise<RegisterResponse> {
    // X-Forwarded-For приоритетнее (за reverse-proxy в prod), Ip() — fallback
    const realIp = (xForwardedFor?.split(',')[0]?.trim() ?? ip) || undefined;
    return this.authService.register(dto, realIp);
  }
}
