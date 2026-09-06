import { Body, Controller, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { PaymentWebhookService } from './payment-webhook.service';
import { type PaymobWebhookPayload } from './paymob-webhook.types';

@Controller('payment/webhooks')
export class PaymentWebhookController {

    constructor(
        private readonly webhookService: PaymentWebhookService
    ) { }

    @Post('paymob')
    @HttpCode(HttpStatus.OK)
    async handlePaymobWebhook(
        @Body() payload: PaymobWebhookPayload,
        @Query('hmac') hmac: string
    ) {
        return this.webhookService.handlePaymobWebhook(payload, hmac);
    }
}
