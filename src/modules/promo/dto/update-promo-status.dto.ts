import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updatePromoStatusSchema = z.object({
  isActive: z.boolean(),
});

export class UpdatePromoStatusDto extends createZodDto(updatePromoStatusSchema) {}
