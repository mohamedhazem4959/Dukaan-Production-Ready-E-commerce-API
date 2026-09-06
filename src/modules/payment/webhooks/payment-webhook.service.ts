import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PaymobWebhookPayload } from './paymob-webhook.types';
import { PaymobHmacService } from './paymob-hmac.service';
import { PaymentWebhookIdempotencyService } from './payment-webhook-idempotency.service';
import { PaymentService } from '../payment.service';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PaymentWebhookService {
    private readonly logger = new Logger(PaymentWebhookService.name);

    constructor(
        private readonly paymobHmacService: PaymobHmacService,
        private readonly idempotencyService: PaymentWebhookIdempotencyService,
        private readonly paymentService: PaymentService,
        private readonly prisma: PrismaService,
    ) { }

    async handlePaymobWebhook(payload: PaymobWebhookPayload, hmac: string) {
        const isValid = this.paymobHmacService.verifyTransactionHmac(payload, hmac);

        if (!isValid) {
            throw new UnauthorizedException(
                'Invalid Paymob webhook signature',
            );
        }

        const transactionId = payload.obj.id;

        const isNewWebhook = await this.idempotencyService.acquire('paymob', transactionId);

        if (!isNewWebhook) {
            return {
                success: true,
                message: 'Webhook already processed',
            };
        }

        const obj = payload.obj as any;

        // Try extracting orderId from common Paymob callback fields
        const candidate = 
            obj.special_reference ||
            obj.order?.merchant_order_id ||
            obj.merchant_order_id ||
            obj.order?.special_reference ||
            obj.payment_key_claims?.special_reference ||
            obj.payment_key_claims?.extra?.special_reference ||
            obj.extra?.special_reference;

        let orderId: number | null = null;

        if (candidate && !Number.isNaN(Number(candidate))) {
            orderId = Number(candidate);
        }

        // Fallback: lookup by Paymob intention ID in Payment records
        if (!orderId) {
            const intentionId = obj.intention || obj.payment_key_claims?.intention_id;
            if (intentionId) {
                const payment = await this.prisma.payment.findFirst({
                    where: { providerPaymentId: String(intentionId) },
                    select: { orderId: true },
                });
                if (payment) {
                    orderId = payment.orderId;
                }
            }
        }

        // Fallback: lookup by Paymob order id
        if (!orderId && obj.order?.id) {
            const payment = await this.prisma.payment.findFirst({
                where: { providerPaymentId: String(obj.order.id) },
                select: { orderId: true },
            });
            if (payment) {
                orderId = payment.orderId;
            }
        }

        if (!orderId || Number.isNaN(orderId)) {
            await this.idempotencyService.release('paymob', transactionId);
            this.logger.error(
                `Unable to find orderId in webhook payload for transaction #${transactionId}. Payload obj: ${JSON.stringify(obj)}`
            );
            return { success: false, message: 'Order reference missing' };
        }

        const isSuccess = payload.obj.success === true;
        await this.paymentService.handleWebhookTransaction(orderId, transactionId, isSuccess);
        return { success: true };
    }
}
