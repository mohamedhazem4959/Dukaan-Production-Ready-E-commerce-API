import { Decimal } from "@prisma/client/runtime/wasm-compiler-edge";

export interface CartItem {
    product: {
        id: number;
        productName: string;
        price: Decimal;
    };
    productId: number;
    quantity: number;
}