/**
 * PasswordResetController — endpoints восстановления пароля (#134).
 *
 * Оба endpoint'а @Public() — клиент не залогинен в момент сброса.
 * Rate-limit (#221): профиль `auth` — 10/min/IP, защита от bruteforce.
 */
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';

import {
  ConfirmPasswordResetDto,
  RequestPasswordResetDto,
} from './dto/password-reset.dto';
import { PasswordResetService } from './password-reset.service';
import { Public } from '../../../common/auth/decorators';

@Controller('auth/password')
export class PasswordResetController {
  constructor(private readonly service: PasswordResetService) {}

  /**
   * 204 NO_CONTENT всегда — anti-enumeration.
   * Не различаем «email не найден» / «email отправлен».
   */
  @Public()
  @Post('reset-request')
  @HttpCode(HttpStatus.NO_CONTENT)
  async request(@Body() dto: RequestPasswordResetDto): Promise<void> {
    await this.service.requestReset(dto.email);
  }

  /**
   * 204 NO_CONTENT при успехе. 401 при невалидном/истёкшем токене.
   * 400 при слишком слабом пароле.
   */
  @Public()
  @Post('reset')
  @HttpCode(HttpStatus.NO_CONTENT)
  async confirm(@Body() dto: ConfirmPasswordResetDto): Promise<void> {
    await this.service.confirmReset(dto.token, dto.newPassword);
  }
}
