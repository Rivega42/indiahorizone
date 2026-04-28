/**
 * ClientsModule — управление профилями клиентов (ПДн).
 *
 * Создаётся автоматически при auth.user.registered (подписка через EventsBus).
 * Эндпоинты профиля /clients/me — #140.
 * Шифрование ПДн — #139.
 */
import { Module } from '@nestjs/common';


import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { EmergencyContactsController } from './emergency-contacts/emergency-contacts.controller';
import { EmergencyContactsService } from './emergency-contacts/emergency-contacts.service';
import { ClientsListener } from './listeners/clients.listener';
import { EventsBusModule } from '../../common/events-bus/events-bus.module';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule, EventsBusModule],
  controllers: [ClientsController, EmergencyContactsController],
  providers: [ClientsService, ClientsListener, EmergencyContactsService],
  exports: [ClientsService, EmergencyContactsService],
})
export class ClientsModule {}
