import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { type RedisOptions } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;
  private subscriber!: Redis;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const url = this.config.get<string>('REDIS_URL', 'redis://localhost:6379');
    const opts: RedisOptions = {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    };

    this.client = new Redis(url, opts);
    this.subscriber = this.client.duplicate();

    this.client.on('error', (err) => this.logger.error({ err }, 'Redis client error'));
    this.subscriber.on('error', (err) => this.logger.error({ err }, 'Redis subscriber error'));
    this.client.on('ready', () => this.logger.log('Redis ready'));
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.allSettled([this.client?.quit(), this.subscriber?.quit()]);
    this.logger.log('Redis disconnected');
  }

  /**
   * Главный клиент — для публикации, GET/SET, Streams XADD, XREADGROUP.
   */
  getClient(): Redis {
    return this.client;
  }

  /**
   * Отдельное соединение для blocking-операций (XREADGROUP с BLOCK).
   * Нельзя использовать главный клиент — он залочится на blocking-команде.
   */
  getSubscriber(): Redis {
    return this.subscriber;
  }

  /**
   * Используется в /readiness — лёгкий ping.
   */
  async healthcheck(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      this.logger.warn({ err: error }, 'Redis healthcheck failed');
      return false;
    }
  }
}
