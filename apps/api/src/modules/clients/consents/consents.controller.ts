/**
 * ConsentsController — granular consent endpoints (#143).
 *
 * - GET    /clients/me/consents              — все consent-записи (active + history)
 * - POST   /clients/me/consents/:type        — grant (создать/обновить активный)
 * - DELETE /clients/me/consents/:type        — revoke активный
 *
 * @Roles('client') — только клиент управляет своими согласиями.
 *
 * URL-param :type валидируется через ParseEnumPipe (только перечисленные типы).
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  Post,
} from '@nestjs/common';

import { ConsentType } from '@prisma/client';

import { ConsentsService } from './consents.service';
import { GrantConsentDto } from './dto/grant-consent.dto';
import { CurrentUser, Roles } from '../../../common/auth/decorators';

import type { AuthenticatedUser } from '../../../common/auth/types';
import type { Consent } from '@prisma/client';

@Controller('clients/me/consents')
@Roles('client')
export class ConsentsController {
  constructor(private readonly consents: ConsentsService) {}

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser): Promise<Consent[]> {
    return this.consents.list(user.id);
  }

  @Post(':type')
  @HttpCode(HttpStatus.OK)
  async grant(
    @CurrentUser() user: AuthenticatedUser,
    @Param('type', new ParseEnumPipe(ConsentType)) type: ConsentType,
    @Body() dto: GrantConsentDto,
  ): Promise<Consent> {
    return this.consents.grant(user.id, type, dto);
  }

  @Delete(':type')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revoke(
    @CurrentUser() user: AuthenticatedUser,
    @Param('type', new ParseEnumPipe(ConsentType)) type: ConsentType,
  ): Promise<void> {
    await this.consents.revoke(user.id, type);
  }
}
