import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const validatePromoSchema = z.object({
  promoCode: z.string().min(1, "Promo code is required"),
  subtotal: z.number().positive("Subtotal must be positive"),
});

export class ValidatePromoDto extends createZodDto(validatePromoSchema) {}
