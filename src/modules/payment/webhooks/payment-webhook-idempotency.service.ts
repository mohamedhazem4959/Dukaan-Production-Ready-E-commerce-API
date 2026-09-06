import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/common/services/redis.service';

@Injectable()
export class PaymentWebhookIdempotencyService {
  private readonly ttlSeconds = 60 * 60;

  constructor(
    private readonly redisService: RedisService,
  ) {}

  async acquire(
    provider: string,
    transactionId: number,
  ): Promise<boolean> {
    const key = this.buildKey(
      provider,
      transactionId,
    );

    const result = await this.redisService
      .getClient()
      .set(
        key,
        'processed',
        'EX',
        this.ttlSeconds,
        'NX',
      );

    return result === 'OK';
  }

  async release(
    provider: string,
    transactionId: number,
  ): Promise<void> {
    const key = this.buildKey(provider, transactionId);
    await this.redisService.del(key);
  }

  private buildKey(
    provider: string,
    transactionId: number,
  ): string {
    return `payment:webhook:${provider}:${transactionId}`;
  }
}