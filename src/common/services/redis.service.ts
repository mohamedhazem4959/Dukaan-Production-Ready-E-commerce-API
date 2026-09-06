import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis(
      process.env.REDIS_URL ?? 'redis://localhost:7001',
    );
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