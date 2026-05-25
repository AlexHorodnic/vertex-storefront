import { CurrencyPipe } from '@angular/common';
import { Component, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { CartItem } from '../../../../core/models/cart.model';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { CheckoutTotals, PaymentMethodLogo } from '../../checkout.models';

@Component({
  selector: 'app-order-summary',
  imports: [CurrencyPipe, ReactiveFormsModule, IconComponent],
  templateUrl: './order-summary.component.html',
  styleUrl: './order-summary.component.scss',
})
export class OrderSummaryComponent {
  readonly items = input.required<readonly CartItem[]>();
  readonly totals = input.required<CheckoutTotals>();
  readonly estimatedDelivery = input.required<string>();
  readonly variantLabel = input.required<(item: CartItem) => string>();
  readonly promoApplied = output<number>();

  protected readonly promoCode = new FormControl('', { nonNullable: true });
  protected readonly promoState = signal<'idle' | 'loading' | 'success' | 'invalid'>('idle');
  protected readonly promoMessage = signal('Use VERTEXDEMO for 10% off this demo order.');

  protected readonly paymentMethods: readonly PaymentMethodLogo[] = [
    { id: 'visa', name: 'Visa', iconPath: 'assets/icons/payment/visa.svg' },
    { id: 'mastercard', name: 'Mastercard', iconPath: 'assets/icons/payment/mastercard.svg' },
    { id: 'paypal', name: 'PayPal', iconPath: 'assets/icons/payment/paypal.svg' },
    { id: 'applepay', name: 'Apple Pay', iconPath: 'assets/icons/payment/applepay.svg' },
    { id: 'googlepay', name: 'Google Pay', iconPath: 'assets/icons/payment/googlepay.svg' },
    { id: 'klarna', name: 'Klarna', iconPath: 'assets/icons/payment/klarna.svg' },
  ];

  protected applyPromo(): void {
    const code = this.promoCode.value.trim().toUpperCase();

    if (!code) {
      this.promoState.set('invalid');
      this.promoMessage.set('Enter a promo code.');
      this.promoApplied.emit(0);
      return;
    }

    this.promoState.set('loading');
    this.promoMessage.set('Checking promo code...');

    globalThis.setTimeout(() => {
      if (this.promoCode.value.trim().toUpperCase() === 'VERTEXDEMO') {
        const discount = Math.round(this.totals().subtotal * 0.1);
        this.promoState.set('success');
        this.promoMessage.set('VERTEXDEMO applied. 10% demo discount added.');
        this.promoApplied.emit(discount);
        return;
      }

      this.promoState.set('invalid');
      this.promoMessage.set('That promo code is not valid for this demo checkout.');
      this.promoApplied.emit(0);
    }, 550);
  }

  protected updatePromo(): void {
    if (this.promoState() !== 'idle') {
      this.promoState.set('idle');
      this.promoMessage.set('Use VERTEXDEMO for 10% off this demo order.');
      this.promoApplied.emit(0);
    }
  }
}
