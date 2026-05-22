import { Injectable, computed, signal } from '@angular/core';

import { CartItem } from '../models/cart.model';
import { Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly itemsState = signal<readonly CartItem[]>([]);
  private readonly drawerOpenState = signal(false);

  readonly items = this.itemsState.asReadonly();
  readonly isDrawerOpen = this.drawerOpenState.asReadonly();
  readonly totals = computed(() => {
    const items = this.itemsState();

    return {
      itemCount: items.reduce((total, item) => total + item.quantity, 0),
      subtotal: items.reduce((total, item) => total + item.product.price * item.quantity, 0),
    };
  });

  addItem(product: Product, variantId: string, quantity: number): void {
    if (product.stock <= 0 || quantity < 1) {
      return;
    }

    this.itemsState.update((items) => {
      const existing = items.find(
        (item) => item.product.id === product.id && item.variantId === variantId,
      );

      if (!existing) {
        return [...items, { product, variantId, quantity }];
      }

      return items.map((item) =>
        item.product.id === product.id && item.variantId === variantId
          ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) }
          : item,
      );
    });

    this.openDrawer();
  }

  updateQuantity(productId: string, variantId: string, quantity: number): void {
    if (quantity < 1) {
      this.removeItem(productId, variantId);
      return;
    }

    this.itemsState.update((items) =>
      items.map((item) =>
        item.product.id === productId && item.variantId === variantId
          ? { ...item, quantity: Math.min(quantity, item.product.stock) }
          : item,
      ),
    );
  }

  removeItem(productId: string, variantId: string): void {
    this.itemsState.update((items) =>
      items.filter((item) => item.product.id !== productId || item.variantId !== variantId),
    );
  }

  clearCart(): void {
    this.itemsState.set([]);
  }

  openDrawer(): void {
    this.drawerOpenState.set(true);
  }

  closeDrawer(): void {
    this.drawerOpenState.set(false);
  }
}
