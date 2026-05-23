import { Injectable, computed, effect, inject, signal } from '@angular/core';

import { CartItem, PersistedCartItem } from '../models/cart.model';
import { Product } from '../models/product.model';
import { ProductService } from './product.service';
import { StorageService } from './storage.service';
import { isPersistedCartItems } from '../utils/storage-guards.util';

const cartStorageKey = 'vertex:cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly productService = inject(ProductService);
  private readonly storageService = inject(StorageService);
  private readonly itemsState = signal<readonly CartItem[]>(this.loadStoredItems());
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

  constructor() {
    effect(() => {
      const persistedItems = this.itemsState().map<PersistedCartItem>((item) => ({
        productId: item.product.id,
        variantId: item.variantId,
        quantity: item.quantity,
      }));

      this.storageService.set(cartStorageKey, persistedItems);
    });
  }

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

  private loadStoredItems(): readonly CartItem[] {
    return this.storageService
      .get<readonly PersistedCartItem[]>(cartStorageKey, [], isPersistedCartItems)
      .map((item) => {
        const product = this.productService.getProductById(item.productId);
        const variant = product?.variants.find((productVariant) => productVariant.id === item.variantId);

        if (!product || !variant || product.stock <= 0) {
          return undefined;
        }

        return {
          product,
          variantId: variant.id,
          quantity: Math.min(item.quantity, product.stock),
        };
      })
      .filter((item): item is CartItem => Boolean(item));
  }
}
