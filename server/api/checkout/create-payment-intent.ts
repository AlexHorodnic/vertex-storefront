/**
 * Backend placeholder for Stripe Express Checkout.
 *
 * This file is intentionally outside src/ so Angular never bundles it.
 * Implement the same POST route in your real backend:
 *   POST /api/checkout/create-payment-intent
 *
 * Required environment variable:
 *   STRIPE_SECRET_KEY=sk_test_...
 *
 * The frontend must only receive the PaymentIntent client_secret.
 * Never expose STRIPE_SECRET_KEY in Angular code.
 */

export interface CreatePaymentIntentRequest {
  readonly amount: number;
  readonly currency: 'usd';
  readonly source: 'stripe-express-checkout-demo';
}

export interface CreatePaymentIntentResponse {
  readonly clientSecret: string;
}

export async function createPaymentIntentPlaceholder(
  request: CreatePaymentIntentRequest,
): Promise<CreatePaymentIntentResponse> {
  if (!Number.isInteger(request.amount) || request.amount < 50) {
    throw new Error('A valid amount in cents is required.');
  }

  if (request.currency !== 'usd') {
    throw new Error('Only USD demo checkout is configured.');
  }

  throw new Error(
    'Create a Stripe PaymentIntent here with STRIPE_SECRET_KEY and return { clientSecret: paymentIntent.client_secret }.',
  );
}
