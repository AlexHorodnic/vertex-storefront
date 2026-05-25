import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { environment } from '../../../../environments/environment';

const stripeScriptSrc = 'https://js.stripe.com/v3/';

@Injectable({
  providedIn: 'root',
})
export class StripeExpressCheckoutService {
  private readonly platformId = inject(PLATFORM_ID);
  private stripePromise: Promise<StripeInstance | null> | null = null;

  get publishableKey(): string {
    return environment.stripePublishableKey;
  }

  loadStripe(): Promise<StripeInstance | null> {
    if (!isPlatformBrowser(this.platformId) || !this.publishableKey) {
      return Promise.resolve(null);
    }

    this.stripePromise ??= this.loadScript().then(() => window.Stripe?.(this.publishableKey) ?? null);

    return this.stripePromise;
  }

  async createPaymentIntent(amount: number, currency: string): Promise<string> {
    const response = await fetch('/api/checkout/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency,
        source: 'stripe-express-checkout-demo',
      }),
    });

    if (!response.ok) {
      throw new Error('Unable to start wallet checkout. Please continue with the demo checkout below.');
    }

    const data = (await response.json()) as Partial<CreatePaymentIntentResponse>;

    if (!data.clientSecret) {
      throw new Error('Wallet checkout is not configured yet. Please continue with the demo checkout below.');
    }

    return data.clientSecret;
  }

  private loadScript(): Promise<void> {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${stripeScriptSrc}"]`,
    );

    if (existingScript) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = stripeScriptSrc;
      script.async = true;
      script.addEventListener('load', () => resolve());
      script.addEventListener('error', () => reject(new Error('Stripe.js failed to load.')));
      document.head.append(script);
    });
  }
}

export interface CreatePaymentIntentResponse {
  readonly clientSecret: string;
}

export interface StripeError {
  readonly message?: string;
}

export interface StripeInstance {
  elements(options: StripeElementsOptions): StripeElements;
  confirmPayment(options: StripeConfirmPaymentOptions): Promise<{ readonly error?: StripeError }>;
}

export interface StripeElements {
  create(type: 'expressCheckout', options: StripeExpressCheckoutOptions): StripeExpressCheckoutElement;
  submit(): Promise<{ readonly error?: StripeError }>;
}

export interface StripeExpressCheckoutElement {
  mount(selector: string | HTMLElement): void;
  destroy(): void;
  on(event: 'ready', handler: (event: StripeExpressCheckoutReadyEvent) => void): void;
  on(event: 'confirm', handler: () => void): void;
}

export interface StripeExpressCheckoutReadyEvent {
  readonly availablePaymentMethods?: Record<string, boolean>;
}

export interface StripeElementsOptions {
  readonly mode: 'payment';
  readonly amount: number;
  readonly currency: string;
  readonly appearance: {
    readonly theme: 'stripe';
    readonly variables: Record<string, string>;
  };
}

export interface StripeExpressCheckoutOptions {
  readonly emailRequired: boolean;
  readonly phoneNumberRequired: boolean;
  readonly buttonHeight: number;
  readonly buttonTheme: {
    readonly applePay: 'white-outline';
    readonly googlePay: 'white';
  };
  readonly buttonType: {
    readonly applePay: 'check-out';
    readonly googlePay: 'checkout';
  };
  readonly paymentMethods: {
    readonly applePay: 'auto';
    readonly googlePay: 'auto';
    readonly link: 'never';
    readonly paypal: 'never';
    readonly amazonPay: 'never';
    readonly klarna: 'never';
  };
}

export interface StripeConfirmPaymentOptions {
  readonly elements: StripeElements;
  readonly clientSecret: string;
  readonly confirmParams: {
    readonly return_url: string;
  };
  readonly redirect: 'if_required';
}

declare global {
  interface Window {
    Stripe?: (publishableKey: string) => StripeInstance | null;
  }
}
