/**
 * AuditModule — append-only audit log всех domain events (#218) +
 * admin endpoint просмотра (#219).
 *
 * Listener подписан wildcard'ом `*` на EventsBus и пишет каждое событие
 * в audit_events (append-only через Postgres trigger).
 *
 * AuditController с @Roles('admin') предоставляет cursor-paginated GET /audit.
 * Сам факт чтения логируется как audit-event `audit.read` (recursive).
 */
import { Module } from '@nestjs/common';

import { AuditController } from './audit.controller';
import { AuditEventListener } from './audit.listener';
import { AuditService } from './audit.service';
import { EventsBusModule } from '../../common/events-bus/events-bus.module';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule, EventsBusModule],
  controllers: [AuditController],
  providers: [AuditEventListener, AuditService],
  exports: [AuditService],
})
export class AuditModule {}
