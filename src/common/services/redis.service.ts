import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import "dotenv/config";

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly redis: Redis;

  constructor() {
    const redisUrl =
      process.env.REDIS_URL_PROD ||
      process.env.REDIS_URL ||
      'redis://localhost:6379';

    this.redis = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
      retryStrategy(times) {
        if (times > 2) return null;
        return Math.min(times * 100, 1000);
      },
    });

    this.redis.on('connect', () => {
      this.logger.log('Successfully connected to Redis!');
    });

    this.redis.on('error', (err) => {
      this.logger.error(`Redis connection error: ${err?.message || err}`);
    });
  }

  getClient(): Redis {
    return this.redis;
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(
    key: string,
    value: string | number | Buffer | any,
    ttlInSeconds?: number,
  ): Promise<'OK' | null> {
    if (ttlInSeconds !== undefined) {
      return this.redis.set(key, value, 'EX', ttlInSeconds);
    }
    return this.redis.set(key, value);
  }

  async setex(
    key: string,
    value: string | number | Buffer | any,
    seconds: number,
  ): Promise<string | null> {
    return this.redis.setex(key, seconds, value);
  }

  async setnx(
    key: string,
    value: string | number | Buffer | any,
  ): Promise<number> {
    return this.redis.setnx(key, value);
  }

  async del(...keys: (string | string[])[]): Promise<number> {
    const flatKeys = keys.flat();
    if (flatKeys.length === 0) return 0;
    return this.redis.del(...flatKeys);
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}