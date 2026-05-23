import { Product, ProductFilters } from '../models/product.model';
import { CATALOG_CATEGORY_FILTERS } from '../constants/storefront.constants';

export function filterProducts(products: readonly Product[], filters: ProductFilters): Product[] {
  const searchTerm = filters.searchTerm.trim().toLowerCase();
  const selectedCategory = CATALOG_CATEGORY_FILTERS.find(
    (category) => category.id === filters.categoryId,
  );

  return products
    .filter((product) => {
      const matchesCategory =
        !selectedCategory ||
        selectedCategory.id === 'all' ||
        selectedCategory.categoryIds.includes(product.categoryId);
      const matchesSearch =
        !searchTerm ||
        product.name.toLowerCase().includes(searchTerm) ||
        product.categoryName.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.longDescription.toLowerCase().includes(searchTerm) ||
        product.specs.some((spec) => spec.value.toLowerCase().includes(searchTerm));

      return matchesCategory && matchesSearch;
    })
    .sort((first, second) => {
      switch (filters.sort) {
        case 'price-low':
          return first.price - second.price;
        case 'price-high':
          return second.price - first.price;
        case 'rating':
          return second.rating - first.rating;
        case 'featured':
          return Number(second.isFeatured) - Number(first.isFeatured);
      }
    });
}
