import { PersistedCartItem } from '../models/cart.model';
import {
  ProductCategoryFilter,
  ProductCollectionFilter,
  ProductFilters,
  ProductSort,
} from '../models/product.model';
import { CATALOG_CATEGORY_FILTERS } from '../constants/storefront.constants';

const sortValues: readonly ProductSort[] = ['featured', 'price-low', 'price-high', 'rating'];
const collectionValues: readonly ProductCollectionFilter[] = [
  'all',
  'new-arrivals',
  'sale',
  'best-seller',
];

export function isPersistedCartItems(value: unknown): value is readonly PersistedCartItem[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        isRecord(item) &&
        typeof item['productId'] === 'string' &&
        typeof item['variantId'] === 'string' &&
        isPositiveInteger(item['quantity']),
    )
  );
}

export function isProductFilters(value: unknown): value is ProductFilters {
  return (
    isRecord(value) &&
    typeof value['searchTerm'] === 'string' &&
    isProductCategoryFilter(value['categoryId']) &&
    (value['collectionId'] === undefined || isProductCollectionFilter(value['collectionId'])) &&
    isProductSort(value['sort']) &&
    isRecord(value['priceRange']) &&
    isFinitePrice(value['priceRange']['min']) &&
    isFinitePrice(value['priceRange']['max'])
  );
}

export function isVariantSelectionMap(value: unknown): value is Record<string, string> {
  return (
    isRecord(value) && Object.values(value).every((variantId) => typeof variantId === 'string')
  );
}

function isProductCategoryFilter(value: unknown): value is ProductCategoryFilter {
  return (
    typeof value === 'string' && CATALOG_CATEGORY_FILTERS.some((category) => category.id === value)
  );
}

function isProductSort(value: unknown): value is ProductSort {
  return typeof value === 'string' && sortValues.includes(value as ProductSort);
}

function isProductCollectionFilter(value: unknown): value is ProductCollectionFilter {
  return typeof value === 'string' && collectionValues.includes(value as ProductCollectionFilter);
}

function isFinitePrice(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
