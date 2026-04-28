/**
 * S3Service — обёртка над AWS SDK v3 для bucket operations (#173).
 *
 * Совместим с любым S3-API провайдером:
 * - **Cloudflare R2** (prod-recommended): дешевле AWS, бесплатный egress
 * - **AWS S3** (если бюджет позволяет)
 * - **MinIO** (dev-окружение, self-hosted)
 *
 * Конфигурация через env:
 *   S3_ENDPOINT     — URL S3 API (R2: `https://<account>.r2.cloudflarestorage.com`,
 *                     MinIO: `http://minio:9000`, AWS: можно опустить)
 *   S3_REGION       — обычно `auto` для R2, `us-east-1` или подходящий для AWS
 *   S3_BUCKET       — имя bucket'а
 *   S3_ACCESS_KEY   — credentials
 *   S3_SECRET_KEY
 *   S3_FORCE_PATH_STYLE — `true` для MinIO (path-style), `false` (default) для R2/AWS
 *
 * Если `S3_BUCKET` не задан — S3Service инициализируется в STUB-режиме
 * (бросает 503 при попытках использовать). Это безопасный default для dev
 * без credentials.
 *
 * Bucket settings (Вика настраивает на стороне R2/MinIO):
 * - Private (no public ACLs)
 * - Server-side encryption SSE-S3 (R2 — automatic, MinIO — config flag)
 * - CORS для presigned upload (in #174)
 */
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly client: S3Client | null;
  readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    const bucket = config.get<string>('S3_BUCKET');
    if (!bucket) {
      this.client = null;
      this.bucket = '';
      this.logger.warn(
        'S3_BUCKET не задан — S3Service в stub-режиме. Все операции вернут 503.',
      );
      return;
    }

    const endpoint = config.get<string>('S3_ENDPOINT');
    const region = config.get<string>('S3_REGION', 'auto');
    const accessKeyId = config.get<string>('S3_ACCESS_KEY', '');
    const secretAccessKey = config.get<string>('S3_SECRET_KEY', '');
    const forcePathStyle =
      config.get<string>('S3_FORCE_PATH_STYLE', 'false') === 'true';

    this.client = new S3Client({
      region,
      ...(endpoint ? { endpoint } : {}),
      forcePathStyle,
      credentials: { accessKeyId, secretAccessKey },
    });
    this.bucket = bucket;

    this.logger.log({ endpoint, region, bucket, forcePathStyle }, 's3.client.created');
  }

  /**
   * Сгенерировать presigned PUT URL для прямой загрузки клиентом в S3.
   * Используется в #174.
   *
   * @param key       S3 object key
   * @param mimeType  Content-Type — должен совпадать при PUT
   * @param ttlSec    TTL ссылки (default 15 min — достаточно для upload)
   */
  async getPresignedPutUrl(
    key: string,
    mimeType: string,
    ttlSec = 15 * 60,
  ): Promise<string> {
    this.assertReady();
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType,
    });
    return getSignedUrl(this.client as S3Client, command, { expiresIn: ttlSec });
  }

  /**
   * Сгенерировать presigned GET URL для скачивания/просмотра.
   * Используется в #177.
   *
   * @param key
   * @param ttlSec — default 1 час; для long-lived UI можно дольше
   */
  async getPresignedGetUrl(key: string, ttlSec = 60 * 60): Promise<string> {
    this.assertReady();
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client as S3Client, command, { expiresIn: ttlSec });
  }

  /**
   * Проверить что объект существует в bucket'е и получить его size + content-type.
   * Используется при finalize (#175): подтверждаем что upload завершился.
   */
  async headObject(key: string): Promise<{ size: number; contentType: string } | null> {
    this.assertReady();
    try {
      const result = await (this.client as S3Client).send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return {
        size: Number(result.ContentLength ?? 0),
        contentType: result.ContentType ?? 'application/octet-stream',
      };
    } catch (err) {
      // 404 от S3 — объект не существует. Любая другая ошибка — re-throw.
      if (
        err instanceof Error &&
        'name' in err &&
        ((err as Error).name === 'NotFound' || (err as Error).name === 'NoSuchKey')
      ) {
        return null;
      }
      throw err;
    }
  }

  /**
   * Сгенерировать s3 key с правильным prefix-pattern.
   * Format: `<env>/<kind>/<yyyymmdd>/<assetId>.<ext>`.
   */
  buildKey(env: string, kind: string, assetId: string, ext: string): string {
    const date = new Date();
    const yyyymmdd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    return `${env}/${kind}/${yyyymmdd}/${assetId}.${ext}`;
  }

  isReady(): boolean {
    return this.client !== null;
  }

  private assertReady(): void {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'S3 не сконфигурирован (S3_BUCKET не задан в env)',
      );
    }
  }
}
