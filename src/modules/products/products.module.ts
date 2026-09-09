import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { UploadsModule } from '../uploads/uploads.module';
import { PrismaService } from '../../prisma.service';
import { ProductReviewModule } from './product_review/product_review.module';

@Module({
  imports: [UploadsModule, ProductReviewModule],
  controllers: [ProductsController],
  providers: [ProductsService, PrismaService],
})
export class ProductsModule {}
