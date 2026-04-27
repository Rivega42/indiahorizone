/**
 * LeadsModule — приём заявок с tour landing pages.
 *
 * - POST /leads — публичный endpoint (с consent и rate-limit)
 *
 * Зависит от PrismaModule, CryptoModule (#139 для шифрования ПДн), RedisModule
 * (для rate-limit), ConfigService (для TELEGRAM_BOT_TOKEN).
 *
 * Issue: #297 [12.4], EPIC #293
 */
import { Module } from '@nestjs/common';

import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { TelegramClient } from './telegram.client';

@Module({
  controllers: [LeadsController],
  providers: [LeadsService, TelegramClient],
  exports: [LeadsService],
})
export class LeadsModule {}
