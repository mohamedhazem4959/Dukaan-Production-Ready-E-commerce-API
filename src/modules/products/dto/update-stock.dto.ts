import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateStockSchema = z.object({
  quantity: z.number().int().min(0, 'Quantity must be a non-negative integer'),
});

export class UpdateStockDto extends createZodDto(updateStockSchema) {}
