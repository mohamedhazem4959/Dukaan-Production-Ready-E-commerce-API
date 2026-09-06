import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PaymobCreateIntentionRequest, PaymobCreateIntentionResponse } from "./paymob.types";
import { RedisService } from "src/common/services/redis.service";

@Injectable()
export class PaymobClient {
    private readonly logger = new Logger(PaymobClient.name);

    private readonly baseUrl: string;
    private readonly secretKey: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly redisService: RedisService,
    ) {
        this.baseUrl = this.configService.get<string>('PAYMOB_BASE_URL')?.replace(/\/$/, '') || 'https://accept.paymob.com';

        this.secretKey = this.configService.get<string>('PAYMOB_SECRET_KEY') ?? '';

        if (!this.secretKey) {
            throw new Error('PAYMOB_SECRET_KEY is not configured');
        }
    }

    async createPaymentIntention(
        payload: PaymobCreateIntentionRequest,
    ): Promise<PaymobCreateIntentionResponse> {
        const cacheKey = payload.special_reference
            ? `paymob:intention:${payload.special_reference}`
            : null;

        if (cacheKey) {
            try {
                const cachedResponse = await this.redisService.get(cacheKey);
                if (cachedResponse) {
                    this.logger.log(`Returning cached Paymob intention for reference ${payload.special_reference}`);
                    return JSON.parse(cachedResponse) as PaymobCreateIntentionResponse;
                }
            } catch (error) {
                this.logger.warn(`Failed to read Paymob intention from cache: ${error}`);
            }
        }

        const overrideBaseUrl = await this.redisService.get('PAYMOB_BASE_URL');
        const baseUrl = overrideBaseUrl?.replace(/\/$/, '') || this.baseUrl;

        const response = await fetch(`${baseUrl}/v1/intention`, {
            method: 'POST',
            headers: {
                Authorization: `Token ${this.secretKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        const responseBody = await response.text();

        let data: unknown;

        try {
            data = responseBody ? JSON.parse(responseBody) : null;
        } catch (error) {
            data = responseBody;
        }

        if (!response.ok) {
            this.logger.error(
                `Paymob API error (${response.status}): ${responseBody}`,
            );

            throw new InternalServerErrorException('Unable to create paymob payment intention');
        }

        const result = data as PaymobCreateIntentionResponse;

        if (cacheKey && result) {
            try {
                await this.redisService.setex(cacheKey, JSON.stringify(result), 3600);
            } catch (error) {
                this.logger.warn(`Failed to cache Paymob intention: ${error}`);
            }
        }

        return result;
    }

}