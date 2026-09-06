import { Decimal } from "@prisma/client/runtime/client";

export interface OrderItem {
    orderId: number,
    productId: number,
    quantity: number,
    price: Decimal
}