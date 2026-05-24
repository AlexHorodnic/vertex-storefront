import { CurrencyPipe, DOCUMENT } from '@angular/common';
import { Component, DestroyRef, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CartService } from '../../../core/services/cart.service';
import { CartItem } from '../../../core/models/cart.model';
import { QuantitySelectorComponent } from '../../../shared/components/quantity-selector/quantity-selector.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-cart-drawer',
  imports: [CurrencyPipe, RouterLink, QuantitySelectorComponent, IconComponent],
  templateUrl: './cart-drawer.component.html',
  styleUrl: './cart-drawer.component.scss',
})
export class CartDrawerComponent {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly cartService = inject(CartService);

  constructor() {
    effect(() => {
      this.document.body.classList.toggle('cart-drawer-open', this.cartService.isDrawerOpen());
    });

    this.destroyRef.onDestroy(() => {
      this.document.body.classList.remove('cart-drawer-open');
    });
  }

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
