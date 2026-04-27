import { Global, Module } from '@nestjs/common';

import { CryptoService } from './crypto.service';

/**
 * Global CryptoService.
 * Использование:
 *   constructor(private readonly crypto: CryptoService) {}
 *   const cipher = this.crypto.encrypt(plaintext);
 *
 * Также используется напрямую в Prisma encryption extension
 * (apps/api/src/common/prisma/extensions/encrypt.ts).
 */
@Global()
@Module({
  providers: [CryptoService],
  exports: [CryptoService],
})
export class CryptoModule {}
