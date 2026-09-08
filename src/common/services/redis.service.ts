import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import "dotenv/config";

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly redis: Redis;

  constructor() {

    this.redis = new Redis(
      process.env.NODE_ENV === 'development' ? process.env.REDIS_URL! : process.env.REDIS_URL_PROD! as string
    );

    this.redis.on('connect', () => {
      console.log('Successfully connected to Upstash Redis!');
    });

    this.redis.on('error', (err) => {
      console.error('Redis error:', err);
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