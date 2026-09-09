import { Test, TestingModule } from '@nestjs/testing';
import { PaymentWebhookService } from './payment-webhook.service';
import { PaymobHmacService } from './paymob-hmac.service';
import { PaymentWebhookIdempotencyService } from './payment-webhook-idempotency.service';
import { PaymentService } from '../payment.service';
import { PrismaService } from '../../../prisma.service';

describe('PaymentWebhookService', () => {
  let service: PaymentWebhookService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentWebhookService,
        {
          provide: PaymobHmacService,
          useValue: {},
        },
        {
          provide: PaymentWebhookIdempotencyService,
          useValue: {},
        },
        {
          provide: PaymentService,
          useValue: {},
        },
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<PaymentWebhookService>(PaymentWebhookService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
