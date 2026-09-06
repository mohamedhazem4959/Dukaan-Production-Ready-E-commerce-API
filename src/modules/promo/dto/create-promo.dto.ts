import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createPromoSchema = z.object({
  promoCode: z.string().min(1, 'Promo code is required'),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  discountValue: z.number().positive('Discount value must be positive'),
  usageLimit: z.number().int().positive('Usage limit must be a positive integer'),
  startsAt: z.string().datetime({ offset: true }).pipe(z.coerce.date()),
  expiresAt: z.string().datetime({ offset: true }).pipe(z.coerce.date()),
});

export class CreatePromoDto extends createZodDto(createPromoSchema) {}
