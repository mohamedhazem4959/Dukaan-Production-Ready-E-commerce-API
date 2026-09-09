jest.mock('sanitize-html', () => ({
  __esModule: true,
  default: (str: string) => str,
}));

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { RedisService } from '../../common/services/redis.service';
import { PaymentService } from '../payment/payment.service';

describe('OrderController', () => {
  let controller: OrderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: OrderService,
          useValue: {},
        },
        {
          provide: RedisService,
          useValue: {},
        },
        {
          provide: PaymentService,
          useValue: {},
        },
        {
          provide: JwtService,
          useValue: {},
        },
        Reflector,
      ],
    }).compile();

    controller = module.get<OrderController>(OrderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
