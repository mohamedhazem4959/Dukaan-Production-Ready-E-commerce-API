import { createZodDto } from 'nestjs-zod';
import { zSafeString } from '../../../common/utils/zod.utils';
import { z } from 'zod';


export const createCategorySchema = z.object({

    categoryName: zSafeString(z.string().min(3, "category name must be at least 3 characters").max(30, "category name must be at most 30 characters")),
    categoryParentId: z.number().positive().optional()
})

export class CreateCategoryDto extends createZodDto(createCategorySchema) {}
