import { CreatePaymentRequest } from "./types/create-payment.request";
import { CreatePaymentResult } from "./types/create-payment.result";

export interface PaymentGateway {
    createPayment(
        request: CreatePaymentRequest,
    ): Promise<CreatePaymentResult>;

}