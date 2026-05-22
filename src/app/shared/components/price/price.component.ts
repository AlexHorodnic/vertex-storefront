import { CurrencyPipe } from '@angular/common';
import { Component, input } from '@angular/core';

import { DEFAULT_CURRENCY } from '../../../core/constants/storefront.constants';

@Component({
  selector: 'app-price',
  imports: [CurrencyPipe],
  templateUrl: './price.component.html',
  styleUrl: './price.component.scss',
})
export class PriceComponent {
  readonly amount = input.required<number>();
  readonly compareAt = input<number | undefined>();
  readonly currency = input(DEFAULT_CURRENCY);
}
