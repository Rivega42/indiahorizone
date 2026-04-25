import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { PasswordService } from './services/password.service';

/**
 * Auth module — register / login / logout / refresh / 2FA / password-reset.
 * Источник: docs/BACKLOG/M5/B_AUTH.md.
 *
 * В этом slice реализован только register (#127). Остальные сервисы
 * добавляются в следующих issues (#128–#137) — каждая отдельным PR.
 */
@Module({
  controllers: [AuthController],
  providers: [AuthService, PasswordService],
  exports: [AuthService, PasswordService],
})
export class AuthModule {}
