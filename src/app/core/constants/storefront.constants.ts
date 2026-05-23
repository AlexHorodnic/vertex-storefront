import { CatalogCategoryFilter } from '../models/product.model';

export const DEFAULT_CURRENCY = 'USD';

export const STORE_NAVIGATION = [
  { label: 'Home', path: '/' },
  { label: 'Products', path: '/products' },
] as const;

export const CATALOG_CATEGORY_FILTERS: readonly CatalogCategoryFilter[] = [
  { id: 'all', label: 'All', categoryIds: [] },
  { id: 'laptops', label: 'Laptops', categoryIds: ['laptops'] },
  { id: 'monitors', label: 'Monitors', categoryIds: ['monitors'] },
  { id: 'audio', label: 'Audio', categoryIds: ['headphones', 'speakers'] },
  { id: 'keyboards', label: 'Keyboards', categoryIds: ['keyboards'] },
  { id: 'mice', label: 'Mice', categoryIds: ['mice'] },
  { id: 'smartwatches', label: 'Smartwatches', categoryIds: ['smartwatches'] },
  { id: 'webcams', label: 'Webcams', categoryIds: ['webcams'] },
  {
    id: 'desk-accessories',
    label: 'Desk Accessories',
    categoryIds: ['desk-accessories'],
  },
  {
    id: 'charging-accessories',
    label: 'Charging Accessories',
    categoryIds: ['charging-accessories'],
  },
] as const;
