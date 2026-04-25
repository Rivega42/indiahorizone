import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { JwtTokenService } from './services/jwt.service';
import { LoginService } from './services/login.service';
import { PasswordService } from './services/password.service';

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
  controllers: [AuthController],
  providers: [AuthService, LoginService, PasswordService, JwtTokenService],
  exports: [AuthService, LoginService, PasswordService, JwtTokenService],
})
export class AuthModule {}
