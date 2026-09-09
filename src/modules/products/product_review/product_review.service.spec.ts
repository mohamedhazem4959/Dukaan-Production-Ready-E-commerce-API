import { Test, TestingModule } from '@nestjs/testing';
import { ProductReviewService } from './product_review.service';
import { PrismaService } from '../../../prisma.service';

describe('ProductReviewService', () => {
  let service: ProductReviewService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductReviewService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ProductReviewService>(ProductReviewService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
