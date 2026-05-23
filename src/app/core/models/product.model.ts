export interface ProductCategory {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly imageUrl: string;
  readonly productCount: number;
}

export interface ProductVariant {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly inStock: boolean;
}

export interface ProductSpec {
  readonly label: string;
  readonly value: string;
}

export interface Product {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly categoryId: string;
  readonly categoryName: string;
  readonly description: string;
  readonly longDescription: string;
  readonly price: number;
  readonly originalPrice?: number;
  readonly rating: number;
  readonly reviewCount: number;
  readonly imageUrl: string;
  readonly gallery: readonly string[];
  readonly badge?: string;
  readonly isFeatured: boolean;
  readonly stock: number;
  readonly stockStatus: 'In stock' | 'Low stock' | 'Preorder' | 'Sold out';
  readonly variants: readonly ProductVariant[];
  readonly specs: readonly ProductSpec[];
  readonly relatedProductIds: readonly string[];
}

export type ProductSort = 'featured' | 'price-low' | 'price-high' | 'rating';

export type ProductCategoryFilter =
  | 'all'
  | 'laptops'
  | 'monitors'
  | 'audio'
  | 'keyboards'
  | 'mice'
  | 'smartwatches'
  | 'webcams'
  | 'desk-accessories'
  | 'charging-accessories';

export interface CatalogCategoryFilter {
  readonly id: ProductCategoryFilter;
  readonly label: string;
  readonly categoryIds: readonly string[];
}

export interface ProductFilters {
  readonly searchTerm: string;
  readonly categoryId: ProductCategoryFilter;
  readonly sort: ProductSort;
  readonly priceRange: ProductPriceRange;
}

export interface ProductPriceRange {
  readonly min: number;
  readonly max: number;
}
