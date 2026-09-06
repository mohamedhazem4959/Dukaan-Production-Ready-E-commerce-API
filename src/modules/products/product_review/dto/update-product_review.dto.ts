import { createZodDto } from 'nestjs-zod';
import { createProductReviewSchema } from './create-product_review.dto';

export const updateProductReviewSchema = createProductReviewSchema.partial();

export class UpdateProductReviewDto extends createZodDto(updateProductReviewSchema) {}
