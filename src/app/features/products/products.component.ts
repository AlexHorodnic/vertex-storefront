import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { CATALOG_CATEGORY_FILTERS } from '../../core/constants/storefront.constants';
import {
  ProductCategoryFilter,
  ProductFilters,
  ProductPriceRange,
  ProductSort,
} from '../../core/models/product.model';
import { ProductService } from '../../core/services/product.service';
import { StorageService } from '../../core/services/storage.service';
import { filterProducts } from '../../core/utils/product-filter.util';
import { isProductFilters } from '../../core/utils/storage-guards.util';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ProductGridComponent } from '../../shared/components/product-grid/product-grid.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { SectionHeaderComponent } from '../../shared/components/section-header/section-header.component';
import { SkeletonCardComponent } from '../../shared/components/skeleton-card/skeleton-card.component';

const filtersStorageKey = 'vertex:catalogFilters';
const initialVisibleProductCount = 12;
const visibleProductIncrement = 12;
const loadMoreDelayMs = 420;

@Component({
  selector: 'app-products',
  imports: [
    FormsModule,
    EmptyStateComponent,
    IconComponent,
    ProductGridComponent,
    SectionHeaderComponent,
    SkeletonCardComponent,
  ],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
})
export class ProductsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly storageService = inject(StorageService);

  protected readonly categoryFilters = CATALOG_CATEGORY_FILTERS;
  protected readonly sortOptions: readonly { value: ProductSort; label: string }[] = [
    { value: 'featured', label: 'Featured' },
    { value: 'price-low', label: 'Price: low to high' },
    { value: 'price-high', label: 'Price: high to low' },
    { value: 'rating', label: 'Top rated' },
  ];
  protected readonly pricePresets: readonly { label: string; range: ProductPriceRange }[] = [
    { label: 'Under $150', range: { min: 0, max: 150 } },
    { label: '$150-$500', range: { min: 150, max: 500 } },
    { label: '$500-$1,500', range: { min: 500, max: 1500 } },
    { label: '$1,500+', range: { min: 1500, max: 3000 } },
  ];
  protected readonly maxCatalogPrice =
    Math.ceil(Math.max(...this.productService.products().map((product) => product.price)) / 100) *
    100;
  protected readonly filters = signal<ProductFilters>(this.loadInitialFilters());
  protected readonly visibleProductCount = signal(initialVisibleProductCount);
  protected readonly isLoading = signal(true);
  protected readonly isLoadingMore = signal(false);
  protected readonly isSortMenuOpen = signal(false);
  protected readonly selectedSortLabel = computed(
    () =>
      this.sortOptions.find((option) => option.value === this.filters().sort)?.label ?? 'Featured',
  );
  protected readonly filteredProducts = computed(() =>
    filterProducts(this.productService.products(), this.filters()),
  );
  protected readonly visibleProducts = computed(() =>
    this.filteredProducts().slice(0, this.visibleProductCount()),
  );
  protected readonly hasMoreProducts = computed(
    () => this.visibleProducts().length < this.filteredProducts().length,
  );
  protected readonly loadMoreSkeletons = computed(() => {
    const remainingProducts = this.filteredProducts().length - this.visibleProducts().length;
    const skeletonCount = Math.min(visibleProductIncrement, Math.max(remainingProducts, 0));

    return Array.from({ length: skeletonCount }, (_, index) => index);
  });
  private loadMoreRequestId = 0;

  constructor() {
    effect(() => this.storageService.set(filtersStorageKey, this.filters()));
    window.setTimeout(() => this.isLoading.set(false), 450);
  }

  updateSearch(searchTerm: string): void {
    this.filters.update((filters) => ({ ...filters, searchTerm }));
    this.resetVisibleProducts();
  }

  updateCategory(categoryId: ProductCategoryFilter): void {
    this.filters.update((filters) => ({ ...filters, categoryId }));
    this.resetVisibleProducts();
  }

  updateSort(sort: ProductSort): void {
    this.filters.update((filters) => ({ ...filters, sort }));
    this.isSortMenuOpen.set(false);
    this.resetVisibleProducts();
  }

  updatePriceRange(field: keyof ProductPriceRange, value: string): void {
    const parsedValue = Number(value);

    if (!Number.isFinite(parsedValue)) {
      return;
    }

    this.filters.update((filters) => {
      const nextRange = { ...filters.priceRange, [field]: Math.max(0, parsedValue) };
      const min = Math.min(nextRange.min, nextRange.max);
      const max = Math.max(nextRange.min, nextRange.max);

      return {
        ...filters,
        priceRange: {
          min: Math.min(min, this.maxCatalogPrice),
          max: Math.min(max, this.maxCatalogPrice),
        },
      };
    });
    this.resetVisibleProducts();
  }

  applyPriceRange(priceRange: ProductPriceRange): void {
    this.filters.update((filters) => ({
      ...filters,
      priceRange: this.normalizePriceRange(priceRange),
    }));
    this.resetVisibleProducts();
  }

  isPricePresetActive(priceRange: ProductPriceRange): boolean {
    const currentRange = this.filters().priceRange;
    const presetRange = this.normalizePriceRange(priceRange);

    return currentRange.min === presetRange.min && currentRange.max === presetRange.max;
  }

  resetFilters(): void {
    this.filters.set(this.defaultFilters());
    this.resetVisibleProducts();
  }

  loadMoreProducts(): void {
    if (this.isLoadingMore() || !this.hasMoreProducts()) {
      return;
    }

    const currentCount = this.visibleProductCount();
    const nextCount = Math.min(
      currentCount + visibleProductIncrement,
      this.filteredProducts().length,
    );
    const nextProducts = this.filteredProducts().slice(currentCount, nextCount);
    const requestId = ++this.loadMoreRequestId;

    this.isLoadingMore.set(true);

    Promise.allSettled([this.preloadProductImages(nextProducts), this.delay(loadMoreDelayMs)]).then(
      () => {
        if (requestId !== this.loadMoreRequestId) {
          return;
        }

        this.visibleProductCount.set(nextCount);
        this.isLoadingMore.set(false);
      },
    );
  }

  private preloadProductImages(products: readonly { imageUrl: string }[]): Promise<void> {
    return Promise.allSettled(
      products.map(
        (product) =>
          new Promise<void>((resolve) => {
            const image = new Image();

            image.onload = () => resolve();
            image.onerror = () => resolve();
            image.src = product.imageUrl;
          }),
      ),
    ).then(() => undefined);
  }

  private delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => {
      window.setTimeout(() => {
        resolve();
      }, milliseconds);
    });
  }

  toggleSortMenu(): void {
    this.isSortMenuOpen.update((isOpen) => !isOpen);
  }

  closeSortMenu(): void {
    this.isSortMenuOpen.set(false);
  }

  handleSortFocusOut(event: FocusEvent): void {
    const currentTarget = event.currentTarget;
    const relatedTarget = event.relatedTarget;

    if (
      currentTarget instanceof HTMLElement &&
      relatedTarget instanceof Node &&
      currentTarget.contains(relatedTarget)
    ) {
      return;
    }

    this.closeSortMenu();
  }

  private categoryFromRoute(): ProductCategoryFilter {
    const categoryId = this.route.snapshot.queryParamMap.get('category');
    const category = CATALOG_CATEGORY_FILTERS.find((item) => item.id === categoryId);

    if (category) {
      return category.id;
    }

    const aggregateCategory = CATALOG_CATEGORY_FILTERS.find((item) =>
      item.categoryIds.includes(categoryId ?? ''),
    );

    return aggregateCategory?.id ?? 'all';
  }

  private loadInitialFilters(): ProductFilters {
    const storedFilters = this.storageService.get<ProductFilters>(
      filtersStorageKey,
      this.defaultFilters(),
      isProductFilters,
    );
    const routeCategory = this.categoryFromRoute();
    const categoryId = this.route.snapshot.queryParamMap.has('category')
      ? routeCategory
      : storedFilters.categoryId;

    return {
      ...storedFilters,
      categoryId,
      priceRange: this.normalizePriceRange(storedFilters.priceRange),
    };
  }

  private defaultFilters(): ProductFilters {
    return {
      searchTerm: '',
      categoryId: 'all',
      sort: 'featured',
      priceRange: { min: 0, max: this.maxCatalogPrice },
    };
  }

  private normalizePriceRange(priceRange: ProductPriceRange): ProductPriceRange {
    const min = Math.max(0, Math.min(priceRange.min, this.maxCatalogPrice));
    const max = Math.max(0, Math.min(priceRange.max, this.maxCatalogPrice));

    return {
      min: Math.min(min, max),
      max: Math.max(min, max),
    };
  }

  private resetVisibleProducts(): void {
    this.loadMoreRequestId++;
    this.isLoadingMore.set(false);
    this.visibleProductCount.set(initialVisibleProductCount);
  }
}
