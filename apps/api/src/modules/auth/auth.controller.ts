import { Body, Controller, Headers, HttpCode, HttpStatus, Ip, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './services/auth.service';
import { LoginService } from './services/login.service';
import { LogoutService } from './services/logout.service';
import { RefreshService } from './services/refresh.service';
import { CurrentUser, Public } from '../../common/auth/decorators';
import { THROTTLE_PROFILE } from '../../common/throttle/throttle.config';

import type { LoginResponse } from './dto/login.dto';
import type { RefreshResponse } from './dto/refresh.dto';
import type { RegisterResponse } from './dto/register.dto';
import type { AuthenticatedUser } from '../../common/auth/types';

/**
 * Rate-limit (#221): на /auth/* применяется профиль `auth` (10/min/IP).
 * IP-based чтобы атакующий не мог обойти лимит через смену email.
 */
@Controller('auth')
@Throttle({ [THROTTLE_PROFILE.auth]: { limit: 10, ttl: 60_000 } })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly loginService: LoginService,
    private readonly refreshService: RefreshService,
    private readonly logoutService: LogoutService,
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

  /**
   * POST /auth/logout
   *
   * Header: Authorization: Bearer <accessToken>
   * Returns 204 No Content.
   *
   * Инвалидирует ТЕКУЩУЮ сессию (sessionId из JWT-claim). Идемпотентен —
   * повторный вызов не ошибка. Клиент должен сам удалить токены из storage.
   */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
    @Headers('x-forwarded-for') xForwardedFor?: string,
  ): Promise<void> {
    const realIp = (xForwardedFor?.split(',')[0]?.trim() ?? ip) || undefined;
    await this.logoutService.logout(user.id, user.sessionId, {
      ip: realIp,
      userAgent,
    });
  }

  /**
   * POST /auth/logout-all
   *
   * Header: Authorization: Bearer <accessToken>
   * Returns 200 + { revokedCount }.
   *
   * Инвалидирует ВСЕ active сессии user'а (включая текущую). Используется
   * при reset password, suspicious «не я», или явно из UI «выйти со всех
   * устройств».
   */
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @CurrentUser() user: AuthenticatedUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
    @Headers('x-forwarded-for') xForwardedFor?: string,
  ): Promise<{ revokedCount: number }> {
    const realIp = (xForwardedFor?.split(',')[0]?.trim() ?? ip) || undefined;
    return this.logoutService.logoutAll(user.id, { ip: realIp, userAgent });
  }
}
