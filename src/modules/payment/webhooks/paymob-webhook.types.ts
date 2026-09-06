export interface PaymobWebhookPayload {
    type?: string;

    obj: {
        id: number;

        amount_cents: number;

        created_at: string;

        currency: string;

        error_occured: boolean;

        has_parent_transaction: boolean;

        integration_id: number;

        is_3d_secure: boolean;

        is_auth: boolean;

        is_capture: boolean;

        is_refunded: boolean;

        is_standalone_payment: boolean;

        is_voided: boolean;

        pending: boolean;

        success: boolean;

        owner: number;

        order: {
            id: number;
        };

        source_data: {
            pan: string;
            sub_type: string;
            type: string;
        };

        [key: string]: unknown;
    };

    [key: string]: unknown;
}