import { Inject, Injectable } from "@nestjs/common";
import { PAYMOB_CLIENT } from "./paymob.constants";
import { PaymobClient } from "./paymob.client";
import { ConfigService } from "@nestjs/config";
import { CreatePaymentRequest } from "../../gateway/types/create-payment.request";
import { CreatePaymentResult } from "../../gateway/types/create-payment.result";
import { PaymobBillingData, PaymobCreateIntentionRequest } from "./paymob.types";
import { PaymobMapper } from "./paymob.mapper";

@Injectable()
export class PaymobGateway implements PaymobGateway {
    private readonly integrationId: number;
    private readonly publicKey: string;
    private readonly baseUrl: string;
    private readonly frontendUrl: string;
    constructor(
        @Inject(PAYMOB_CLIENT)
        private readonly paymobClient: PaymobClient,

        private readonly configService: ConfigService
    ) {
        const integrationId = this.configService.get<string>('PAYMOB_INTEGRATION_ID');

        if (!integrationId) {
            throw new Error('PAYMOB_INTEGRATION_ID is not configured');
        }

        this.integrationId = Number(integrationId);

        if (Number.isNaN(this.integrationId)) {
            throw new Error('PAYMOB_INTEGRATION_ID must be a valid number');
        }

        this.publicKey = this.configService.get<string>('PAYMOB_PUBLIC_KEY') ?? '';

        if (!this.publicKey) {
            throw new Error(
                'PAYMOB_PUBLIC_KEY is not configured',
            );
        }

        this.baseUrl = this.configService.get<string>('PAYMOB_BASE_URL')?.replace(/\/$/, '') || 'https://accept.paymob.com';

        this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    }

    async createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResult> {
        const payload: PaymobCreateIntentionRequest = {
            amount: Math.round(request.amount * 100),

            currency: request.currency,

            payment_methods: [
                this.integrationId
            ],

            billing_data: this.buildBillingData(request),

            items: request.items.map((item) => ({
                name: item.product.productName,
                amount: Math.round(item.price * 100),
                quantity: item.quantity
            })),

            special_reference: String(request.orderId),
        };

        const response = await this.paymobClient.createPaymentIntention(payload);

        const checkoutUrl = `${this.baseUrl}/unifiedcheckout` + `?publicKey=${encodeURIComponent(this.publicKey)}` + `&clientSecret=${encodeURIComponent(response.client_secret)}`;

        return PaymobMapper.toCreatePaymentResult(
            response,
            checkoutUrl
        )
    }

    private buildBillingData(request: CreatePaymentRequest): PaymobBillingData {
        return {
            apartment: 'NA',
            floor: 'NA',
            first_name: request.customer.firstName || 'Customer',
            last_name: request.customer.lastName || 'User',
            street: request.address?.shippingStreet || 'Street',
            building: request.address?.shippingBuilding || 'Building',
            phone_number: request.customer.phone || '01000000000',
            shipping_method: 'PKG',
            city: request.address?.shippingCity || 'Cairo',
            country: 'EG',
            state: request.address?.shippingCity || 'Cairo',
            email: request.customer.email,
            postal_code: '11511',
        };
    }
}