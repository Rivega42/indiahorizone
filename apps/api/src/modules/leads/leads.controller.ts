/**
 * LeadsController — публичный endpoint для приёма заявок с tour landing.
 *
 * - POST /leads — `@Public()`, валидация через class-validator,
 *   server-side check consent, rate-limit по IP.
 *
 * Issue: #297 [12.4]
 */
import { Body, Controller, HttpCode, HttpStatus, Ip, Post, Req } from '@nestjs/common';

import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadsService } from './leads.service';
import { Public } from '../../common/auth/decorators';

import type { Request } from 'express';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateLeadDto,
    @Req() req: Request,
    @Ip() ip: string,
  ): Promise<{ id: string }> {
    /*
     * X-Forwarded-For — приоритет, если стоит за reverse-proxy (nginx/Caddy).
     * Иначе req.ip (Express trust proxy = 1).
     */
    const forwarded = req.header('x-forwarded-for');
    const realIp = forwarded != null && forwarded.length > 0 ? forwarded.split(',')[0]?.trim() : ip;

    const userAgent = req.header('user-agent');

    const input: { dto: CreateLeadDto; ip?: string; userAgent?: string } = { dto };
    if (realIp != null && realIp.length > 0) input.ip = realIp;
    if (userAgent != null && userAgent.length > 0) input.userAgent = userAgent;

    return this.leads.create(input);
  }
}
