import { CurrencyPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { CheckoutConfirmation } from '../../checkout.models';

@Component({
  selector: 'app-checkout-success',
  imports: [CurrencyPipe, RouterLink, IconComponent],
  templateUrl: './checkout-success.component.html',
  styleUrl: './checkout-success.component.scss',
})
export class CheckoutSuccessComponent {
  readonly confirmation = input.required<CheckoutConfirmation>();
}
