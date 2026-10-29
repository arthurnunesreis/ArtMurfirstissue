export type PaymentEvent = {
  providerId: string;
  providerRef: string;
  type: string;
};

export interface PaymentProvider {
  id: string;

  supports(input: { payerCountry: string; currency: string; method?: string }): boolean;

  createCheckout(input: {
    pledgeId: string;
    amountMinor: bigint;
    currency: string;
    customerEmail: string;
    returnUrl: string;
  }): Promise<{
    redirectUrl: string;
    providerRef: string;
  }>;

  verifyWebhook(req: Request): Promise<PaymentEvent>;

  refund(providerRef: string, amountMinor?: bigint): Promise<void>;
}
