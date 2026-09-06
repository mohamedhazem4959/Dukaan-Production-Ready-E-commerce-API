import { Test, TestingModule } from '@nestjs/testing';
import { PaymentWebhookController } from './payment-webhook.controller';
import { PaymentWebhookService } from './payment-webhook.service';

describe('PaymentWebhookController', () => {
  let controller: PaymentWebhookController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentWebhookController],
      providers: [
        {
          provide: PaymentWebhookService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<PaymentWebhookController>(PaymentWebhookController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
