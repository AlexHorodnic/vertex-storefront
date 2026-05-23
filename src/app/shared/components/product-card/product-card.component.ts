import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CartService } from '../../../core/services/cart.service';
import { Product } from '../../../core/models/product.model';
import { stockStatusClass } from '../../../core/utils/stock-status.util';
import { BadgeComponent } from '../badge/badge.component';
import { PriceComponent } from '../price/price.component';
import { RatingComponent } from '../rating/rating.component';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink, BadgeComponent, PriceComponent, RatingComponent],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
})
export class ProductCardComponent {
  private readonly cartService = inject(CartService);

  readonly product = input.required<Product>();

  addToCart(): void {
    const product = this.product();
    const variant = product.variants.find((item) => item.inStock);

    if (variant) {
      this.cartService.addItem(product, variant.id, 1);
    }
  }

  stockClass(): string {
    return stockStatusClass(this.product());
  }
}
