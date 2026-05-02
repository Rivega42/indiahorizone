import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller';
import { PasswordResetController } from './password-reset/password-reset.controller';
import { PasswordResetService } from './password-reset/password-reset.service';
import { AuthService } from './services/auth.service';
import { JwtTokenService } from './services/jwt.service';
import { LoginService } from './services/login.service';
import { LogoutService } from './services/logout.service';
import { PasswordService } from './services/password.service';
import { RefreshService } from './services/refresh.service';
import { SuspiciousLoginDetector } from './services/suspicious-login.detector';
import { SessionsController } from './sessions/sessions.controller';
import { SessionsService } from './sessions/sessions.service';
import { TwoFaChallengeService } from './two-fa/two-fa-challenge.service';
import { TwoFaController } from './two-fa/two-fa.controller';
import { TwoFaService } from './two-fa/two-fa.service';

/**
 * Auth module — register / login / logout / refresh / 2FA / password-reset.
 * Источник: docs/BACKLOG/M5/B_AUTH.md.
 *
 * После #127 (register) + #128 (login + JWT) — следующие issues:
 * - #129 refresh-token rotation + reuse-detection
 * - #130 logout + logout-all
 * - #131 RBAC guard
 * - #132/#133 2FA TOTP enrollment + verify
 * - #134 password reset через email
 * - #136 suspicious-session detection
 */
@Module({
  imports: [
    // JwtModule register — секрет берётся из ConfigService в JwtTokenService.
    // Глобальный module не требуется — JwtTokenService сам читает env через ConfigService.
    JwtModule.register({}),
  ],
  controllers: [AuthController, TwoFaController, PasswordResetController, SessionsController],
  providers: [
    AuthService,
    LoginService,
    RefreshService,
    LogoutService,
    PasswordService,
    JwtTokenService,
    TwoFaService,
    TwoFaChallengeService,
    PasswordResetService,
    SessionsService,
    SuspiciousLoginDetector,
  ],
  exports: [
    AuthService,
    LoginService,
    RefreshService,
    LogoutService,
    PasswordService,
    JwtTokenService,
    TwoFaService,
    TwoFaChallengeService,
    PasswordResetService,
    SessionsService,
    SuspiciousLoginDetector,
  ],
})
export class AuthModule {}
