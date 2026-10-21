import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';
import { randomUUID } from 'crypto';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class StorageService implements OnModuleInit {
  private client: Minio.Client;
  private readonly bucket = process.env.MINIO_BUCKET || 'waste-images';

  constructor(private redis: RedisService) {}

  async onModuleInit() {
    this.client = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT!,
      port: Number(process.env.MINIO_PORT),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY!,
      secretKey: process.env.MINIO_SECRET_KEY!,
    });

    const exists = await this.client.bucketExists(this.bucket);

    if (!exists) {
      await this.client.makeBucket(this.bucket);

      const policy = {
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${this.bucket}/*`],
        }],
      };
      await this.client.setBucketPolicy(this.bucket, JSON.stringify(policy));
    }
  }

  async upload(file: any, folder: string, userId: string) {
    const extension = file.originalname.split('.').pop();
    const filename = `${folder}/${randomUUID()}.${extension}`;

    await this.client.putObject(this.bucket, filename, file.buffer, file.size, {
      'Content-Type': file.mimetype,
    });

    const url = `${process.env.MINIO_PUBLIC_URL ?? 'http://localhost:9000'}/${this.bucket}/${filename}`;
    // remember the uploader so completion can only use their own fresh photo
    await this.redis.set(`upload:${url}`, userId, 'EX', 7200);
    await this.redis.set(`uploadtime:${url}`, String(Date.now()), 'EX', 7200);
    return url;
  }
}