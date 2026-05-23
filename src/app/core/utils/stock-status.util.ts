import { Product } from '../models/product.model';

export function stockStatusClass(product: Product): string {
  if (product.stock === 0 || product.stockStatus === 'Sold out') {
    return 'stock-status stock-status--out';
  }

  if (product.stockStatus === 'Low stock') {
    return 'stock-status stock-status--low';
  }

  return 'stock-status stock-status--in';
}
