import { Module } from '@nestjs/common';
import { ProductReviewService } from './product_review.service';
import { ProductReviewController } from './product_review.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [ProductReviewController],
  providers: [ProductReviewService, PrismaService],
})
export class ProductReviewModule {}
