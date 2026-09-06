export interface PaymobBillingData {
  apartment: string;
  floor: string;
  first_name: string;
  last_name: string;
  street: string;
  building: string;
  phone_number: string;
  shipping_method: string;
  city: string;
  country: string;
  state: string;
  email: string;
  postal_code: string;
}

export interface PaymobItem {
  name: string;
  amount: number;
  description?: string;
  quantity: number;
  image?: string;
}

export interface PaymobCreateIntentionRequest {
  amount: number;
  currency: string;
  payment_methods: number[];
  billing_data: PaymobBillingData;
  items: PaymobItem[];
  special_reference: string;
  notification_url?: string;
  redirection_url?: string;
  expiration?: number;
  extras?: Record<string, unknown>;
}

export interface PaymobCreateIntentionResponse {
  id: string;
  client_secret: string;

  intention_order_id?: number;

  payment_methods?: Array<{
    integration_id: number;
    alias: string | null;
    name: string;
    method_type: string;
    currency: string;
    live: boolean;
  }>;

  status: string;
  confirmed: boolean;

  special_reference?: string;

  created?: string;
}