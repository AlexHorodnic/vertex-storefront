import { Product } from './product.model';

export interface CartItem {
  readonly product: Product;
  readonly variantId: string;
  readonly quantity: number;
}

export interface PersistedCartItem {
  readonly productId: string;
  readonly variantId: string;
  readonly quantity: number;
}

export interface CartTotals {
  readonly itemCount: number;
  readonly subtotal: number;
}
