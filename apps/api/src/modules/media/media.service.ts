/**
 * MediaService — bookkeeping MediaAsset records (#173).
 *
 * Endpoints (presigned upload, finalize, signed URL для playback) — отдельные
 * issues #174-#177. Этот service — schema-операции и core flow:
 * - createAsset (status=pending) — при request на upload
 * - markUploaded (status=uploaded) — при finalize callback
 * - markFailed (status=failed) — при upload error / transcode fail
 *
 * Бизнес-правила access control (кто может читать MediaAsset) — в caller'ах.
 * Например ChatMessage.attachments → MediaService.findById с проверкой что
 * user участник thread'а (assertThreadAccess из ChatService).
 */
import { randomUUID } from 'node:crypto';

import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { S3Service } from './s3.service';
import { OutboxService } from '../../common/outbox/outbox.service';
import { PrismaService } from '../../common/prisma/prisma.service';

import type { MediaAsset, MediaAssetKind } from '@prisma/client';

const NODE_ENV = process.env['NODE_ENV'] ?? 'development';

interface CreateAssetInput {
  ownerId: string;
  kind: MediaAssetKind;
  mimeType: string;
  /** Initial size, может уточниться при finalize */
  size: number;
  /** Опциональный extension для S3 key (default по mime) */
  extension?: string;
  caption?: string;
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
    private readonly s3: S3Service,
  ) {}

  /**
   * Создать MediaAsset row + сгенерировать S3 key.
   * Returns asset с status=pending. Caller (#174) сразу же запросит
   * presigned URL для upload'а через s3.getPresignedPutUrl(asset.s3Key).
   */
  async createAsset(input: CreateAssetInput): Promise<MediaAsset> {
    const id = randomUUID();
    const ext = input.extension ?? extensionFromMime(input.mimeType);
    const s3Key = this.s3.buildKey(NODE_ENV, input.kind, id, ext);

    const asset = await this.prisma.mediaAsset.create({
      data: {
        id,
        ownerId: input.ownerId,
        kind: input.kind,
        mimeType: input.mimeType,
        size: BigInt(input.size),
        s3Key,
        status: 'pending',
        ...(input.caption !== undefined ? { caption: input.caption } : {}),
      },
    });

    this.logger.log(
      { assetId: asset.id, ownerId: asset.ownerId, kind: asset.kind, s3Key },
      'media.asset.created',
    );

    return asset;
  }

  /**
   * Пометить asset как uploaded (после finalize при #175).
   * Verify в S3 чем-то upload happened — caller вызовет S3Service.headObject.
   *
   * Outbox event `media.asset.uploaded` для подписчиков (transcode worker #176).
   */
  async markUploaded(assetId: string, actualSize: number): Promise<MediaAsset> {
    const updated = await this.prisma.$transaction(async (tx) => {
      const asset = await tx.mediaAsset.update({
        where: { id: assetId },
        data: {
          status: 'uploaded',
          size: BigInt(actualSize),
        },
      });

      await this.outbox.add(tx, {
        type: 'media.asset.uploaded',
        schemaVersion: 1,
        actor: { type: 'user', id: asset.ownerId },
        payload: {
          assetId: asset.id,
          ownerId: asset.ownerId,
          kind: asset.kind,
          mimeType: asset.mimeType,
          sizeBytes: actualSize,
          s3Key: asset.s3Key,
        },
      });

      return asset;
    });

    this.logger.log({ assetId: updated.id, sizeBytes: actualSize }, 'media.asset.uploaded');

    return updated;
  }

  /**
   * Пометить asset как transcoded (после FFmpeg #176).
   */
  async markTranscoded(assetId: string): Promise<MediaAsset> {
    return this.prisma.mediaAsset.update({
      where: { id: assetId },
      data: { status: 'transcoded' },
    });
  }

  /**
   * Пометить asset как failed (upload error, transcode error, etc.).
   */
  async markFailed(assetId: string): Promise<MediaAsset> {
    return this.prisma.mediaAsset.update({
      where: { id: assetId },
      data: { status: 'failed' },
    });
  }

  async findById(assetId: string): Promise<MediaAsset> {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id: assetId } });
    if (!asset) {
      throw new NotFoundException('MediaAsset не найден');
    }
    return asset;
  }
}

/**
 * Простой mapping mime → extension. Для production — использовать `mime-types`
 * пакет (более полный). Для V1 покрываем основные types.
 */
function extensionFromMime(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'video/webm': 'webm',
    'application/pdf': 'pdf',
  };
  return map[mime] ?? 'bin';
}
