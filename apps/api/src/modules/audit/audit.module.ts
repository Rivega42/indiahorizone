/**
 * AuditModule — append-only audit log всех domain events (#218).
 *
 * Listener подписан wildcard'ом `*` на EventsBus и пишет каждое событие
 * в audit_events (append-only через Postgres trigger).
 *
 * Будущее: #219 admin endpoint просмотра audit-log с фильтрами.
 */
import { Module } from '@nestjs/common';

import { AuditEventListener } from './audit.listener';
import { EventsBusModule } from '../../common/events-bus/events-bus.module';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule, EventsBusModule],
  providers: [AuditEventListener],
})
export class AuditModule {}
