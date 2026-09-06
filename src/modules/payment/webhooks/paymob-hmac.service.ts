import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PaymobWebhookPayload } from "./paymob-webhook.types";
import { createHmac, timingSafeEqual } from "crypto";

@Injectable()
export class PaymobHmacService {
    private readonly hmacSecret: string;

    constructor(private readonly configService: ConfigService) {
        this.hmacSecret = this.configService.get<string>('PAYMOB_HMAC') ?? '';


        if (!this.hmacSecret) {
            throw new Error(
                'PAYMOB_HMAC is not configured',
            );
        }
    }

    verifyTransactionHmac(payload: PaymobWebhookPayload, receivedHmac: string): boolean {
        if (!receivedHmac) {
            return false;
        }

        const obj = payload.obj;

        const fields = [
            obj.amount_cents,
            obj.created_at,
            obj.currency,
            obj.error_occured,
            obj.has_parent_transaction,
            obj.id,
            obj.integration_id,
            obj.is_3d_secure,
            obj.is_auth,
            obj.is_capture,
            obj.is_refunded,
            obj.is_standalone_payment,
            obj.is_voided,
            obj.order.id,
            obj.owner,
            obj.pending,
            obj.source_data?.pan,
            obj.source_data?.sub_type,
            obj.source_data?.type,
            obj.success,
        ];

        const concatenatedValues = fields.map(String).join('');

        const calculatedHmac = createHmac('sha512', this.hmacSecret).update(concatenatedValues).digest('hex');

        return this.safeCompare(calculatedHmac, receivedHmac);
    }

    private safeCompare(calculatedHmac: string, received: string): boolean {
        const calculatedBuffer = Buffer.from(calculatedHmac, 'utf-8');

        const receivedBuffer = Buffer.from(received, 'utf-8');

        if (calculatedBuffer.length !== receivedBuffer.length) {
            return false;
        }

        return timingSafeEqual(calculatedBuffer, receivedBuffer)
    }


}