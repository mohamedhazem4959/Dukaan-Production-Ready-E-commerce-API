import { PaymentProvider } from "src/generated/prisma/client";

export interface CreatePaymentRequest {
  orderId: number;
  amount: number;
  currency: string;
  customer: CustomerData;
  items: OrderItemData[];
  provider?: PaymentProvider;
  address?: {
    shippingCity: string;
    shippingStreet: string;
    shippingBuilding: string;
  };
}

export interface CustomerData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

export interface OrderItemData {
  quantity: number,
  price: number,
  product: {
    productName: string,
  }
}