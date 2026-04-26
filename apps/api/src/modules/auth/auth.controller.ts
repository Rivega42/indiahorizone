import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
} from '@nestjs/common';

import { Public } from '../../common/auth/decorators';

import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './services/auth.service';
import { LoginService } from './services/login.service';
import { RefreshService } from './services/refresh.service';

import type { LoginResponse } from './dto/login.dto';
import type { RefreshResponse } from './dto/refresh.dto';
import type { RegisterResponse } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly loginService: LoginService,
    private readonly refreshService: RefreshService,
  ) {}

  /**
   * POST /auth/register
   *
   * Body: { email, password, role? }
   * Returns 201 + { userId, email, role } или 409 если email занят.
   *
   * Rate-limit: 5 попыток / 15 мин на IP — через throttler (#221).
   */
  @Public()
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
  @Public()
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

  /**
   * POST /auth/refresh
   *
   * Body: { refreshToken: "<sessionId>.<random>" }
   * Returns 200 + { accessToken, refreshToken } (новая пара) или 401 generic.
   *
   * Refresh-rotation: старая Session помечается revokedAt='rotated',
   * создаётся новая Session с тем же userId. Reuse-detection: если
   * приходит уже-revoked refresh-token — invalidate ВСЕ сессии user'а
   * (защита от утечки токена).
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() dto: RefreshDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
    @Headers('x-forwarded-for') xForwardedFor?: string,
  ): Promise<RefreshResponse> {
    const realIp = (xForwardedFor?.split(',')[0]?.trim() ?? ip) || undefined;
    return this.refreshService.refresh(dto, { ip: realIp, userAgent });
  }
}
