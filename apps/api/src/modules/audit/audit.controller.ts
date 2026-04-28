/**
 * AuditController — admin endpoint просмотра audit-log (#219).
 *
 * GET /audit?type=...&actorId=...&actorType=...&from=...&to=...&limit=...&cursor=...
 *
 * @Roles('admin') — только admin. Финансы / concierge — отдельные endpoint'ы
 * с ограниченным scope (если потребуется в будущем). По умолчанию admin
 * видит ВСЁ — это требование 152-ФЗ ст. 14 (полный аудит для compliance).
 *
 * Сам факт чтения логируется как audit-event `audit.read` (recursive).
 */
import { Controller, Get, Query } from '@nestjs/common';

import { AuditService } from './audit.service';
import { ListAuditQueryDto, type ListAuditResponse } from './dto/list-audit.dto';
import { CurrentUser, Roles } from '../../common/auth/decorators';

import type { AuthenticatedUser } from '../../common/auth/types';

@Controller('audit')
@Roles('admin')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListAuditQueryDto,
  ): Promise<ListAuditResponse> {
    return this.audit.list(user.id, query);
  }
}
