import { TestBed } from '@angular/core/testing';

import { installStorageMock } from '../../../testing/storage.mock';
import { CartService } from './cart.service';
import { ProductService } from './product.service';

describe('CartService', () => {
  beforeEach(() => {
    installStorageMock();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('calculates item count and subtotal across cart lines', () => {
    const service = TestBed.inject(CartService);
    const products = TestBed.inject(ProductService);
    const laptop = products.getProductById('p-001')!;
    const monitor = products.getProductById('p-003')!;

    service.addItem(laptop, laptop.variants[0].id, 2);
    service.addItem(monitor, monitor.variants[0].id, 1);

    expect(service.totals()).toEqual({
      itemCount: 3,
      subtotal: laptop.price * 2 + monitor.price,
    });
  });

  it('caps new and existing cart quantities at available stock', () => {
    const service = TestBed.inject(CartService);
    const product = TestBed.inject(ProductService).getProductById('p-001')!;
    const variantId = product.variants[0].id;

    service.addItem(product, variantId, product.stock + 10);
    service.addItem(product, variantId, 2);

    expect(service.items()[0].quantity).toBe(product.stock);
  });

  it('removes a cart line when its quantity falls below one', () => {
    const service = TestBed.inject(CartService);
    const product = TestBed.inject(ProductService).getProductById('p-001')!;
    const variantId = product.variants[0].id;

    service.addItem(product, variantId, 1);
    service.updateQuantity(product.id, variantId, 0);

    expect(service.items()).toEqual([]);
  });

  it('restores only valid persisted products and variants', () => {
    window.localStorage.setItem(
      'vertex:cart',
      JSON.stringify([
        { productId: 'p-001', variantId: 'graphite-1tb', quantity: 2 },
        { productId: 'missing', variantId: 'missing', quantity: 1 },
      ]),
    );

    const service = TestBed.inject(CartService);

    expect(service.items()).toHaveLength(1);
    expect(service.items()[0]).toMatchObject({
      variantId: 'graphite-1tb',
      quantity: 2,
    });
  });
});
