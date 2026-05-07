/**
 * QuizController — endpoints для quiz/анкеты клиента (#B-04, sub #514).
 *
 * - GET   /clients/me/quiz — текущее состояние (всегда — даже до первого ответа)
 * - PATCH /clients/me/quiz — autosave частично заполненного draft'а
 * - POST  /clients/me/quiz — финальный submit (ставит completedAt + outbox event)
 *
 * Доступ: только role=client (через @Roles на классе). RBAC проверяется
 * глобальным JwtAuthGuard.
 *
 * Текст вопросов и финальные формулировки полей в UI — отдельная история
 * (B-04.3 FE), и они зависят от ответа юриста по 152-ФЗ согласиям. Backend-
 * структура от этого не зависит — мы храним нейтральные значения.
 */
import { Body, Controller, Get, NotFoundException, Patch, Post } from '@nestjs/common';

import { ClientsService } from './clients.service';
import { QuizPatchDto, QuizSubmitDto, type QuizResponse } from './dto/quiz.dto';
import { CurrentUser, Roles } from '../../common/auth/decorators';

import type { AuthenticatedUser } from '../../common/auth/types';

@Controller('clients/me/quiz')
@Roles('client')
export class QuizController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  async get(@CurrentUser() user: AuthenticatedUser): Promise<QuizResponse> {
    const quiz = await this.clients.getQuiz(user.id);
    if (!quiz) {
      throw new NotFoundException('Client profile not yet provisioned');
    }
    return quiz;
  }

  @Patch()
  async patch(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: QuizPatchDto,
  ): Promise<QuizResponse> {
    return this.clients.patchQuiz(user.id, dto);
  }

  @Post()
  async submit(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: QuizSubmitDto,
  ): Promise<QuizResponse> {
    return this.clients.submitQuiz(user.id, dto);
  }
}
