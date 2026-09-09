import { createZodDto } from 'nestjs-zod';
import { zSafeString } from '../../../../common/utils/zod.utils';
import { z } from 'zod';

export const createProductReviewSchema = z.object({
    ratingValue: z.number().int().min(1, 'Rating value must be at least 1').max(5, 'Rating value must be at most 5'),
    comment: zSafeString(z.string().min(1, 'Comment must be at least 1 character')).optional()
});

export class CreateProductReviewDto extends createZodDto(createProductReviewSchema) { }