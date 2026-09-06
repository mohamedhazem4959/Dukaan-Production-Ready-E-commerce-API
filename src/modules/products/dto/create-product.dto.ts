import { createZodDto } from 'nestjs-zod';
import { zSafeString } from 'src/common/utils/zod.utils';
import { z } from 'zod';

export const createProductSchema = z.object({
    productName: zSafeString(z.string().min(3, { message: "min product name is 3" }).max(30, { message: "max product name characters are 30" })),
    productDescription: zSafeString(z.string().max(100, { message: "max product description characters are 100" })).optional(),
    sku: zSafeString(z.string().min(3, { message: "min characters for sku are 3" }).regex(
        /^[A-Z0-9]+(-[A-Z0-9]+)+$/,
        { message: "SKU must consist of alphanumeric blocks separated by hyphens (e.g., ABC-123). Spaces or special characters are not allowed." }
    )),
    categoryId: z.coerce.number().int().positive(),
    quantity: z.coerce.number().int().positive(),
    price: z.coerce.number().positive(),
})

export class CreateProductDto extends createZodDto(createProductSchema) {}