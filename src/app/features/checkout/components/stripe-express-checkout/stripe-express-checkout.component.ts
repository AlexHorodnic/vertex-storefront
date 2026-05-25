import {
  AfterViewInit,
  Component,
  ElementRef,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import {
  StripeElements,
  StripeExpressCheckoutElement,
  StripeExpressCheckoutService,
  StripeInstance,
} from '../../services/stripe-express-checkout.service';

type WalletState = 'loading' | 'ready' | 'unavailable' | 'processing' | 'success' | 'error';

@Component({
  selector: 'app-stripe-express-checkout',
  templateUrl: './stripe-express-checkout.component.html',
  styleUrl: './stripe-express-checkout.component.scss',
})
export class StripeExpressCheckoutComponent implements AfterViewInit, OnChanges, OnDestroy {
  private readonly stripeService = inject(StripeExpressCheckoutService);
  private stripe: StripeInstance | null = null;
  private elements: StripeElements | null = null;
  private expressElement: StripeExpressCheckoutElement | null = null;
  private currentAmount = 0;
  private hasView = false;

  readonly total = input.required<number>();
  readonly walletSuccess = output<void>();

  @ViewChild('expressElement', { static: true })
  private readonly expressElementRef!: ElementRef<HTMLElement>;

  protected readonly state = signal<WalletState>('loading');
  protected readonly message = signal('Preparing secure wallet buttons...');

  async ngAfterViewInit(): Promise<void> {
    this.hasView = true;
    await this.mountExpressCheckout();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.hasView || !changes['total'] || changes['total'].firstChange) {
      return;
    }

    void this.mountExpressCheckout();
  }

  ngOnDestroy(): void {
    this.destroyExpressElement();
  }

  private async mountExpressCheckout(): Promise<void> {
    const amount = Math.max(Math.round(this.total() * 100), 50);

    if (amount === this.currentAmount && this.expressElement) {
      return;
    }

    this.currentAmount = amount;
    this.destroyExpressElement();
    this.state.set('loading');
    this.message.set('Preparing secure wallet buttons...');

    try {
      this.stripe = await this.stripeService.loadStripe();

      if (!this.stripe) {
        this.showUnavailable();
        return;
      }

      this.elements = this.stripe.elements({
        mode: 'payment',
        amount,
        currency: 'usd',
        appearance: {
          theme: 'stripe',
          variables: {
            borderRadius: '18px',
            colorPrimary: '#0d47a1',
            colorBackground: '#ffffff',
            colorText: '#14213d',
            fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
          },
        },
      });

      this.expressElement = this.elements.create('expressCheckout', {
        emailRequired: true,
        phoneNumberRequired: true,
        buttonHeight: 44,
        buttonTheme: {
          applePay: 'white-outline',
          googlePay: 'white',
        },
        buttonType: {
          applePay: 'check-out',
          googlePay: 'checkout',
        },
        paymentMethods: {
          applePay: 'auto',
          googlePay: 'auto',
          link: 'never',
          paypal: 'never',
          amazonPay: 'never',
          klarna: 'never',
        },
      });

      this.expressElement.on('ready', (event) => {
        if (Object.values(event.availablePaymentMethods ?? {}).some(Boolean)) {
          this.state.set('ready');
          this.message.set('Demo wallet buttons only. No real payment will be processed.');
          return;
        }

        this.showUnavailable();
      });

      this.expressElement.on('confirm', () => {
        void this.confirmWalletPayment();
      });

      this.expressElement.mount(this.expressElementRef.nativeElement);
    } catch (error) {
      this.state.set('error');
      this.message.set(this.errorMessage(error));
    }
  }

  private async confirmWalletPayment(): Promise<void> {
    if (!this.stripe || !this.elements) {
      this.showUnavailable();
      return;
    }

    this.state.set('processing');
    this.message.set('Authorizing demo wallet payment...');

    try {
      const submitResult = await this.elements.submit();

      if (submitResult.error) {
        throw new Error(submitResult.error.message ?? 'Wallet details could not be submitted.');
      }

      const clientSecret = await this.stripeService.createPaymentIntent(this.currentAmount, 'usd');
      const result = await this.stripe.confirmPayment({
        elements: this.elements,
        clientSecret,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required',
      });

      if (result.error) {
        throw new Error(result.error.message ?? 'Wallet payment could not be completed.');
      }

      this.state.set('success');
      this.message.set('Wallet payment authorized in Stripe test mode.');
      this.walletSuccess.emit();
    } catch (error) {
      this.state.set('error');
      this.message.set(this.errorMessage(error));
    }
  }

  private showUnavailable(): void {
    this.state.set('unavailable');
    this.message.set(
      'Wallet options appear automatically on supported devices and browsers.',
    );
  }

  private destroyExpressElement(): void {
    this.expressElement?.destroy();
    this.expressElement = null;
    this.elements = null;
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error
      ? error.message
      : 'Wallet checkout could not be completed. Please continue below.';
  }
}
