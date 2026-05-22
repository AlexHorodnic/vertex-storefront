import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CartService } from '../../../core/services/cart.service';
import { CartItem } from '../../../core/models/cart.model';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { QuantitySelectorComponent } from '../../../shared/components/quantity-selector/quantity-selector.component';

@Component({
  selector: 'app-cart-drawer',
  imports: [CurrencyPipe, RouterLink, EmptyStateComponent, QuantitySelectorComponent],
  templateUrl: './cart-drawer.component.html',
  styleUrl: './cart-drawer.component.scss',
})
export class CartDrawerComponent {
  protected readonly cartService = inject(CartService);

  close(): void {
    this.cartService.closeDrawer();
  }

  remove(productId: string, variantId: string): void {
    this.cartService.removeItem(productId, variantId);
  }

  updateQuantity(productId: string, variantId: string, quantity: number): void {
    this.cartService.updateQuantity(productId, variantId, quantity);
  }

  variantLabel(item: CartItem): string {
    return (
      item.product.variants.find((variant) => variant.id === item.variantId)?.value ?? 'Standard'
    );
  }
}
