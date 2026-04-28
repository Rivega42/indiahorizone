/**
 * EmergencyContactsController — endpoints контактов экстренной связи (#144).
 *
 * - POST   /clients/me/emergency-contacts        — upsert (по priority)
 * - GET    /clients/me/emergency-contacts        — список (1-2 шт.)
 * - DELETE /clients/me/emergency-contacts/:id    — удалить
 *
 * @Roles('client') — только клиент управляет своими контактами. Админ-доступ
 * к чужим контактам — отдельный endpoint (EPIC 13 admin panel) при необходимости.
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';

import { UpsertEmergencyContactDto } from './dto/upsert-emergency-contact.dto';
import {
  EmergencyContactsService,
  type EmergencyContactDecrypted,
} from './emergency-contacts.service';
import { CurrentUser, Roles } from '../../../common/auth/decorators';

import type { AuthenticatedUser } from '../../../common/auth/types';

@Controller('clients/me/emergency-contacts')
@Roles('client')
export class EmergencyContactsController {
  constructor(private readonly contacts: EmergencyContactsService) {}

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser): Promise<EmergencyContactDecrypted[]> {
    return this.contacts.list(user.id);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async upsert(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertEmergencyContactDto,
  ): Promise<EmergencyContactDecrypted> {
    return this.contacts.upsert(user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    await this.contacts.remove(user.id, id);
  }
}
