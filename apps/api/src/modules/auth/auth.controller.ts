import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
} from '@nestjs/common';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './services/auth.service';
import { LoginService } from './services/login.service';

import type { LoginResponse } from './dto/login.dto';
import type { RegisterResponse } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly loginService: LoginService,
  ) {}

  /**
   * POST /auth/register
   *
   * Body: { email, password, role? }
   * Returns 201 + { userId, email, role } или 409 если email занят.
   *
   * Rate-limit: 5 попыток / 15 мин на IP — через throttler (#221).
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
    @Ip() ip: string,
    @Headers('x-forwarded-for') xForwardedFor?: string,
  ): Promise<RegisterResponse> {
    const realIp = (xForwardedFor?.split(',')[0]?.trim() ?? ip) || undefined;
    return this.authService.register(dto, realIp);
  }

  /**
   * POST /auth/login
   *
   * Body: { email, password }
   * Returns 200 + { accessToken, refreshToken, user } или 401 (generic).
   *
   * 2FA flow (#133) добавится в LoginService позже: при включённой 2FA
   * вернётся { challengeId } вместо токенов; токены выдаются после
   * POST /auth/2fa/verify.
   *
   * Rate-limit: 10 попыток / 15 мин на email — через throttler (#221).
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
    @Headers('x-forwarded-for') xForwardedFor?: string,
  ): Promise<LoginResponse> {
    const realIp = (xForwardedFor?.split(',')[0]?.trim() ?? ip) || undefined;
    return this.loginService.login(dto, { ip: realIp, userAgent });
  }
}
