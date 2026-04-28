/**
 * NotificationPreferencesService — управление preferences (#166).
 *
 * - getAll(userId) — возвращает 4 строки (по одной на category) с merging
 *   custom preferences и defaults
 * - update(userId, category, dto) — upsert preference
 *   - SOS: enabled=false ИЛИ channels=[] → BadRequestException (protected)
 * - shouldNotify(userId, category, channel) — для use из NotifyService
 *
 * Defaults:
 * - trips:     [push, email]   enabled=true
 * - marketing: [email]         enabled=FALSE  (152-ФЗ ст. 18 — opt-in)
 * - sos:       [push, email, sms, telegram]  enabled=true (PROTECTED)
 * - system:    [email]         enabled=true
 */
import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../../common/prisma/prisma.service';

import type {
  ListPreferencesResponse,
  PreferenceItem,
  UpdatePreferenceDto,
} from './dto/preferences.dto';
import type {
  NotificationCategory,
  NotificationChannel,
  NotificationPreference,
} from '@prisma/client';

interface DefaultPreference {
  channels: NotificationChannel[];
  enabled: boolean;
}

const DEFAULTS: Record<NotificationCategory, DefaultPreference> = {
  trips: {
    channels: ['push', 'email'],
    enabled: true,
  },
  marketing: {
    channels: ['email'],
    enabled: false, // 152-ФЗ ст. 18 — opt-in для коммерческих коммуникаций
  },
  sos: {
    channels: ['push', 'email', 'sms', 'telegram'],
    enabled: true, // PROTECTED — service блокирует попытки отключить
  },
  system: {
    channels: ['email'],
    enabled: true,
  },
};

const ALL_CATEGORIES: NotificationCategory[] = ['trips', 'marketing', 'sos', 'system'];
const ALL_CHANNELS: NotificationChannel[] = ['push', 'email', 'sms', 'telegram'];

@Injectable()
export class NotificationPreferencesService {
  private readonly logger = new Logger(NotificationPreferencesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAll(userId: string): Promise<ListPreferencesResponse> {
    const custom = await this.prisma.notificationPreference.findMany({
      where: { userId },
    });
    const customByCategory = new Map<NotificationCategory, NotificationPreference>();
    for (const c of custom) {
      customByCategory.set(c.category, c);
    }

    const items: PreferenceItem[] = ALL_CATEGORIES.map((category) => {
      const c = customByCategory.get(category);
      const def = DEFAULTS[category];
      return {
        category,
        channels: c?.channels ?? def.channels,
        enabled: c?.enabled ?? def.enabled,
        isCustom: c !== undefined,
      };
    });

    return { items };
  }

  async update(
    userId: string,
    category: NotificationCategory,
    dto: UpdatePreferenceDto,
  ): Promise<PreferenceItem> {
    // SOS — protected
    if (category === 'sos') {
      if (dto.enabled === false) {
        throw new BadRequestException(
          'SOS-уведомления нельзя отключить (protected). Это требование безопасности.',
        );
      }
      if (dto.channels?.length === 0) {
        throw new BadRequestException(
          'SOS должен иметь хотя бы один канал. Все 4 канала включены по умолчанию.',
        );
      }
    }

    const def = DEFAULTS[category];
    const upserted = await this.prisma.notificationPreference.upsert({
      where: { userId_category: { userId, category } },
      create: {
        userId,
        category,
        channels: dto.channels ?? def.channels,
        enabled: dto.enabled ?? def.enabled,
      },
      update: {
        ...(dto.channels !== undefined ? { channels: dto.channels } : {}),
        ...(dto.enabled !== undefined ? { enabled: dto.enabled } : {}),
      },
    });

    this.logger.log(
      { userId, category, enabled: upserted.enabled, channelCount: upserted.channels.length },
      'preferences.updated',
    );

    return {
      category,
      channels: upserted.channels,
      enabled: upserted.enabled,
      isCustom: true,
    };
  }

  /**
   * Used by NotifyService.send() (если интегрировать) для проверки
   * разрешения перед отправкой. SOS — всегда true (protected даже от
   * случайной DB-инконсистентности).
   */
  async shouldNotify(
    userId: string,
    category: NotificationCategory,
    channel: NotificationChannel,
  ): Promise<boolean> {
    if (category === 'sos') {
      return true; // protected
    }

    const pref = await this.prisma.notificationPreference.findUnique({
      where: { userId_category: { userId, category } },
      select: { enabled: true, channels: true },
    });

    if (!pref) {
      // No custom — use default
      const def = DEFAULTS[category];
      return def.enabled && def.channels.includes(channel);
    }

    return pref.enabled && pref.channels.includes(channel);
  }

  // Re-export for use в NotifyService:
  static readonly DEFAULTS = DEFAULTS;
  static readonly ALL_CATEGORIES = ALL_CATEGORIES;
  static readonly ALL_CHANNELS = ALL_CHANNELS;
}
