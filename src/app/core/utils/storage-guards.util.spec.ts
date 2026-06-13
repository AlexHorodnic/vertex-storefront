import {
  isPersistedCartItems,
  isProductFilters,
  isVariantSelectionMap,
} from './storage-guards.util';

describe('storage guards', () => {
  it('accepts valid persisted cart items', () => {
    expect(
      isPersistedCartItems([{ productId: 'p-001', variantId: 'graphite-1tb', quantity: 2 }]),
    ).toBe(true);
  });

  it('rejects invalid or unsafe cart quantities', () => {
    expect(
      isPersistedCartItems([{ productId: 'p-001', variantId: 'graphite-1tb', quantity: 0 }]),
    ).toBe(false);
    expect(isPersistedCartItems('not-an-array')).toBe(false);
  });

  it('validates complete catalog filter state', () => {
    expect(
      isProductFilters({
        searchTerm: 'monitor',
        categoryId: 'monitors',
        collectionId: 'sale',
        sort: 'price-low',
        priceRange: { min: 100, max: 1_000 },
      }),
    ).toBe(true);
    expect(
      isProductFilters({
        searchTerm: '',
        categoryId: 'invalid',
        sort: 'featured',
        priceRange: { min: 0, max: 100 },
      }),
    ).toBe(false);
  });

  it('accepts only string values in persisted variant maps', () => {
    expect(isVariantSelectionMap({ 'aureon-luma-14': 'graphite-1tb' })).toBe(true);
    expect(isVariantSelectionMap({ 'aureon-luma-14': 42 })).toBe(false);
  });
});
