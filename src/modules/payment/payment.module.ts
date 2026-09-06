import { Module } from '@nestjs/common';
import { PaymobModule } from './providers/paymob/paymob.module';
import { PaymentService } from './payment.service';
import { PaymentWebhookController } from './webhooks/payment-webhook.controller';
import { PaymentWebhookService } from './webhooks/payment-webhook.service';
import { PaymobHmacService } from './webhooks/paymob-hmac.service';
import { PrismaService } from 'src/prisma.service';
import { PaymentWebhookIdempotencyService } from './webhooks/payment-webhook-idempotency.service';
import { PAYMENT_GATWAY } from './constants/payment.constants';
import { PaymobGateway } from './providers/paymob/paymob.gateway';

@Module({
  imports: [PaymobModule],

  controllers: [PaymentWebhookController],

  providers: [
    PaymentService,
    PaymentWebhookService,
    PaymobHmacService,
    PrismaService,
    PaymentWebhookIdempotencyService,
    {
      provide: PAYMENT_GATWAY,
      useExisting: PaymobGateway
    }
  ],
  exports: [PaymentService]
})
export class PaymentModule { }
