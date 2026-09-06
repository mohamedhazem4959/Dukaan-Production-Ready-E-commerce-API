jest.mock('sanitize-html', () => ({
  __esModule: true,
  default: (str: string) => str,
}));

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { ProductReviewController } from './product_review.controller';
import { ProductReviewService } from './product_review.service';

describe('ProductReviewController', () => {
  let controller: ProductReviewController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductReviewController],
      providers: [
        {
          provide: ProductReviewService,
          useValue: {},
        },
        {
          provide: JwtService,
          useValue: {},
        },
        Reflector,
      ],
    }).compile();

    controller = module.get<ProductReviewController>(ProductReviewController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
