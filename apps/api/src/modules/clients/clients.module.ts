/**
 * ClientsModule — управление профилями клиентов (ПДн).
 *
 * Создаётся автоматически при auth.user.registered (подписка через EventsBus).
 * Эндпоинты профиля — в #140 (/clients/me).
 * Шифрование ПДн — в #139.
 */
import { Module } from '@nestjs/common';

import { EventsBusModule } from '../../common/events-bus/events-bus.module';
import { PrismaModule } from '../../common/prisma/prisma.module';

import { ClientsService } from './clients.service';
import { ClientsListener } from './listeners/clients.listener';

@Module({
  imports: [PrismaModule, EventsBusModule],
  providers: [ClientsService, ClientsListener],
  exports: [ClientsService],
})
export class ClientsModule {}
