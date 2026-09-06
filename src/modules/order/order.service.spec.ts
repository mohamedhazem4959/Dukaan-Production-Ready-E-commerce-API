import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import { PrismaService } from 'src/prisma.service';
import { UserService } from '../user/user.service';
import { PromoService } from '../promo/promo.service';
import { PaymentService } from '../payment/payment.service';

describe('OrderService', () => {
  let service: OrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: UserService,
          useValue: {},
        },
        {
          provide: PromoService,
          useValue: {},
        },
        {
          provide: PaymentService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
