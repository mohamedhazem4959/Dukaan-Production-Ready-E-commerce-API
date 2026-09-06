import { Test, TestingModule } from '@nestjs/testing';
import { ProductReviewController } from './product_review.controller';
import { ProductReviewService } from './product_review.service';

describe('ProductReviewController', () => {
  let controller: ProductReviewController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductReviewController],
      providers: [ProductReviewService],
    }).compile();

    controller = module.get<ProductReviewController>(ProductReviewController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
