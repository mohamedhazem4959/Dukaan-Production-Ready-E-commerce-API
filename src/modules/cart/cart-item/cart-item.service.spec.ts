import { Test, TestingModule } from '@nestjs/testing';
import { CartItemService } from './cart-item.service';
import { PrismaService } from 'src/prisma.service';
import { CartService } from '../cart.service';

describe('CartItemService', () => {
  let service: CartItemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartItemService,
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: CartService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<CartItemService>(CartItemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
