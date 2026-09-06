import { createZodDto } from "nestjs-zod";
import { createCartItemSchema } from "./create-cart-item.dto";

export const updateCartItemSchema = createCartItemSchema.partial();

export class UpdateCartItemDto extends createZodDto(updateCartItemSchema) { }