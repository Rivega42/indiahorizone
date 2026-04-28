/**
 * FeedbackModule — daily feedback клиента в активной поездке.
 *
 * #186 — Prisma модели (FeedbackRequest, Feedback)
 * #188 — endpoints POST/GET (этот PR)
 * #189+ — AI-enrichment (sentiment, topics) post-write
 * #190 — frontend экран feedback
 */
import { Module } from '@nestjs/common';

import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { RedisModule } from '../../common/redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [FeedbackController],
  providers: [FeedbackService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
