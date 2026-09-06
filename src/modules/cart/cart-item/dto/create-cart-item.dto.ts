/**productId Int
  quantity  Int     @default(1)
  isDeleted Boolean @default(false) */

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createCartItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
})

export class CreateCartItemDto extends createZodDto(createCartItemSchema) { }