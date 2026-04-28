/**
 * MediaModule — фото/видео/кружки/документы (#173+).
 *
 * #173 — модели + S3 client (этот PR)
 * #174 — POST /media/upload (presigned URL)
 * #175 — POST /media/:id/finalize (callback после client upload)
 * #176 — FFmpeg transcode worker
 * #177 — GET /media/:id/url (signed URL для playback)
 * #178 — retention scheduler
 */
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { MediaService } from './media.service';
import { S3Service } from './s3.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule, ConfigModule],
  providers: [MediaService, S3Service],
  exports: [MediaService, S3Service],
})
export class MediaModule {}
