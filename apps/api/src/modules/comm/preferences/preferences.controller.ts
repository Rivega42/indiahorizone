/**
 * NotificationPreferencesController — endpoints (#166).
 *
 * GET   /comm/preferences           — все 4 категории (с merging defaults)
 * PATCH /comm/preferences/:category — частичное обновление одной категории
 *
 * Доступ: любая authenticated роль. User управляет ТОЛЬКО своими preferences.
 */
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  Patch,
} from '@nestjs/common';

import { NotificationCategory } from '@prisma/client';

import {
  type ListPreferencesResponse,
  type PreferenceItem,
  UpdatePreferenceDto,
} from './dto/preferences.dto';
import { NotificationPreferencesService } from './preferences.service';
import { CurrentUser } from '../../../common/auth/decorators';

import type { AuthenticatedUser } from '../../../common/auth/types';

@Controller('comm/preferences')
export class NotificationPreferencesController {
  constructor(private readonly service: NotificationPreferencesService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ListPreferencesResponse> {
    return this.service.getAll(user.id);
  }

  @Patch(':category')
  @HttpCode(HttpStatus.OK)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('category', new ParseEnumPipe(NotificationCategory))
    category: NotificationCategory,
    @Body() dto: UpdatePreferenceDto,
  ): Promise<PreferenceItem> {
    return this.service.update(user.id, category, dto);
  }
}
