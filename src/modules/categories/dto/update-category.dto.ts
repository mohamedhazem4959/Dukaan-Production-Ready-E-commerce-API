import { createZodDto } from 'nestjs-zod';
import { zSafeString } from 'src/common/utils/zod.utils';
import { z } from 'zod'

export const updateCategorySchema = z.object({
    categoryName: zSafeString(z.string().min(3, "category name must be at least 3 characters").max(30, "category name must be at most 30 characters")).optional(),
    categoryParentId: z.number("category id is a number value").positive("category id must be a postive number").optional()
})


export class UpdateCategoryDto extends createZodDto(updateCategorySchema) { }
