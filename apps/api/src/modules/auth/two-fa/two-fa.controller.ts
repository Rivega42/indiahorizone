/**
 * TwoFaController — endpoints для enrollment 2FA TOTP (issue #132).
 *
 * - POST /auth/2fa/enroll        — generate secret + QR URL (требует auth)
 * - POST /auth/2fa/verify-enroll — verify code, activate, return recovery codes
 *
 * Verify при login (POST /auth/2fa/verify) — отдельный endpoint в #133.
 *
 * Все endpoints требуют залогиненного user'а (без @Public). Любая роль —
 * 2FA доступен всем (для admin/finance — рекомендуется, для client/guide —
 * по желанию).
 */
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import {
  type EnrollResponse,
  VerifyEnrollDto,
  type VerifyEnrollResponse,
} from './dto/verify-enroll.dto';
import { VerifyTwoFaLoginDto } from './dto/verify-login.dto';
import { TwoFaService } from './two-fa.service';
import { CurrentUser, Public } from '../../../common/auth/decorators';

import type { AuthenticatedUser } from '../../../common/auth/types';
import type { LoginTokenResponse } from '../dto/login.dto';

@Controller('auth/2fa')
export class TwoFaController {
  constructor(private readonly twoFa: TwoFaService) {}

  @Post('enroll')
  @HttpCode(HttpStatus.OK)
  async enroll(@CurrentUser() user: AuthenticatedUser): Promise<EnrollResponse> {
    return this.twoFa.startEnrollment(user.id);
  }

  @Post('verify-enroll')
  @HttpCode(HttpStatus.OK)
  async verifyEnroll(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: VerifyEnrollDto,
  ): Promise<VerifyEnrollResponse> {
    return this.twoFa.completeEnrollment(user.id, dto.code);
  }

  /**
   * Public endpoint — identity proven by challengeId (выдан после успешного password-step).
   * Auth-токены выпускаются ТОЛЬКО при успешном verify (TOTP или recovery code).
   */
  @Public()
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyLogin(@Body() dto: VerifyTwoFaLoginDto): Promise<LoginTokenResponse> {
    return this.twoFa.verifyAtLogin(dto.challengeId, dto.code);
  }
}
