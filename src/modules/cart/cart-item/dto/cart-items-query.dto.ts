import { createZodDto } from "nestjs-zod";
import { z } from "zod";


export const CartItemsQuerySchema = z.object({
    cartId: z.coerce.number().int().positive(),
    productId: z.coerce.number().int().positive()
});

export class CartItemsQueryDto extends createZodDto(CartItemsQuerySchema) { }