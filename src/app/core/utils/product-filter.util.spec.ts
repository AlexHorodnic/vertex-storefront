import { TestBed } from '@angular/core/testing';

import { ProductFilters } from '../models/product.model';
import { ProductService } from '../services/product.service';
import { filterProducts } from './product-filter.util';

describe('filterProducts', () => {
  let products: ReturnType<ProductService['products']>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    products = TestBed.inject(ProductService).products();
  });

  const filters = (overrides: Partial<ProductFilters> = {}): ProductFilters => ({
    searchTerm: '',
    categoryId: 'all',
    collectionId: 'all',
    sort: 'featured',
    priceRange: { min: 0, max: 10_000 },
    ...overrides,
  });

  it('matches product names and specification values case-insensitively', () => {
    expect(
      filterProducts(products, filters({ searchTerm: 'AUREON' })).some(
        (product) => product.name === 'Aureon Luma 14',
      ),
    ).toBe(true);
    expect(filterProducts(products, filters({ searchTerm: 'usb-c' })).length).toBeGreaterThan(0);
  });

  it('combines category, collection, and price filters', () => {
    const result = filterProducts(
      products,
      filters({
        categoryId: 'laptops',
        collectionId: 'best-seller',
        priceRange: { min: 1_000, max: 2_000 },
      }),
    );

    expect(result.length).toBeGreaterThan(0);
    expect(
      result.every(
        (product) =>
          product.categoryId === 'laptops' &&
          product.badge === 'Bestseller' &&
          product.price >= 1_000 &&
          product.price <= 2_000,
      ),
    ).toBe(true);
  });

  it('sorts products by ascending price', () => {
    const result = filterProducts(products, filters({ sort: 'price-low' }));

    expect(result[0].price).toBeLessThanOrEqual(result.at(-1)!.price);
  });

  it('sorts top-rated products first', () => {
    const result = filterProducts(products, filters({ sort: 'rating' }));

    expect(result[0].rating).toBe(Math.max(...products.map((product) => product.rating)));
  });
});
