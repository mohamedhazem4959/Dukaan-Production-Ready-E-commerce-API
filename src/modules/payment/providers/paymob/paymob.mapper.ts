import { CreatePaymentResult, PaymentStatus } from "../../gateway/types/create-payment.result";
import { PaymobCreateIntentionResponse } from "./paymob.types";

export class PaymobMapper {
    static toCreatePaymentResult(
        response: PaymobCreateIntentionResponse,
        checkoutUrl: string,
    ): CreatePaymentResult {
        return {
            providerPaymentId: response.id,
            status: PaymentStatus.PENDING,
            checkoutUrl,
            clientSecret: response.client_secret
        };
    };
}