import { CurrencyPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

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
  readonly variantLabel = input.required<(item: CartItem) => string>();

  protected readonly promoForm = new FormGroup({});

  protected readonly paymentMethods: readonly PaymentMethodLogo[] = [
    { id: 'visa', name: 'Visa', iconPath: 'assets/icons/payment/visa.svg' },
    { id: 'mastercard', name: 'Mastercard', iconPath: 'assets/icons/payment/mastercard.svg' },
    { id: 'paypal', name: 'PayPal', iconPath: 'assets/icons/payment/paypal.svg' },
    { id: 'applepay', name: 'Apple Pay', iconPath: 'assets/icons/payment/applepay.svg' },
    { id: 'googlepay', name: 'Google Pay', iconPath: 'assets/icons/payment/googlepay.svg' },
    { id: 'klarna', name: 'Klarna', iconPath: 'assets/icons/payment/klarna.svg' },
  ];
}
