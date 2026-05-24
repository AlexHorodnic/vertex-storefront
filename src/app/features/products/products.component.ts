import { Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { CATALOG_CATEGORY_FILTERS } from '../../core/constants/storefront.constants';
import {
  ProductCategoryFilter,
  ProductCollectionFilter,
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
const priceStep = 25;
type PriceHandle = 'min' | 'max';

@Component({
  selector: 'app-products',
  imports: [
    FormsModule,
    RouterLink,
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
  protected readonly collectionFilters: readonly {
    id: ProductCollectionFilter;
    label: string;
    description: string;
  }[] = [
    { id: 'all', label: 'All products', description: 'Full Vertex catalog' },
    { id: 'new-arrivals', label: 'New arrivals', description: 'Recently added products' },
    { id: 'sale', label: 'Sale', description: 'Products with current savings' },
    { id: 'best-seller', label: 'Best seller', description: 'Popular customer picks' },
  ];
  protected readonly maxCatalogPrice =
    Math.ceil(Math.max(...this.productService.products().map((product) => product.price)) / 100) *
    100;
  protected readonly priceStep = priceStep;
  protected readonly filters = signal<ProductFilters>(this.loadInitialFilters());
  protected readonly visibleProductCount = signal(initialVisibleProductCount);
  protected readonly isLoading = signal(true);
  protected readonly isLoadingMore = signal(false);
  protected readonly isSortMenuOpen = signal(false);
  protected readonly activePriceHandle = signal<PriceHandle | null>(null);
  protected readonly selectedSortLabel = computed(
    () =>
      this.sortOptions.find((option) => option.value === this.filters().sort)?.label ?? 'Featured',
  );
  protected readonly hasActiveFilters = computed(() => {
    const filters = this.filters();
    const defaults = this.defaultFilters();

    return (
      filters.searchTerm.trim() !== defaults.searchTerm ||
      filters.categoryId !== defaults.categoryId ||
      filters.collectionId !== defaults.collectionId ||
      filters.sort !== defaults.sort ||
      filters.priceRange.min !== defaults.priceRange.min ||
      filters.priceRange.max !== defaults.priceRange.max
    );
  });
  protected readonly filteredProducts = computed(() =>
    filterProducts(this.productService.products(), this.filters()),
  );
  protected readonly visibleProducts = computed(() =>
    this.filteredProducts().slice(0, this.visibleProductCount()),
  );
  protected readonly hasMoreProducts = computed(
    () => this.visibleProducts().length < this.filteredProducts().length,
  );
  protected readonly priceSliderMinPercent = computed(
    () => (this.filters().priceRange.min / this.maxCatalogPrice) * 100,
  );
  protected readonly priceSliderMaxPercent = computed(
    () => (this.filters().priceRange.max / this.maxCatalogPrice) * 100,
  );
  protected readonly loadMoreSkeletons = computed(() => {
    const remainingProducts = this.filteredProducts().length - this.visibleProducts().length;
    const skeletonCount = Math.min(visibleProductIncrement, Math.max(remainingProducts, 0));

    return Array.from({ length: skeletonCount }, (_, index) => index);
  });
  private loadMoreRequestId = 0;
  private priceSliderElement: HTMLElement | null = null;

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

  updateCollection(collectionId: ProductCollectionFilter): void {
    this.filters.update((filters) => ({ ...filters, collectionId }));
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
      this.normalizeCurrentPriceRange();
      return;
    }

    this.updatePriceField(field, parsedValue);
  }

  setActivePriceHandle(handle: PriceHandle): void {
    this.activePriceHandle.set(handle);
  }

  clearActivePriceHandle(handle: PriceHandle): void {
    if (this.activePriceHandle() === handle && !this.priceSliderElement) {
      this.activePriceHandle.set(null);
    }
  }

  startPriceDrag(handle: PriceHandle, event: PointerEvent, sliderElement: HTMLElement): void {
    event.preventDefault();
    this.priceSliderElement = sliderElement;
    this.activePriceHandle.set(handle);
    this.updatePriceFromPointer(handle, event, sliderElement);
  }

  startPriceTrackDrag(event: PointerEvent, sliderElement: HTMLElement): void {
    event.preventDefault();
    const value = this.priceValueFromPointer(event, sliderElement);
    const handle = this.closestPriceHandle(value);

    this.startPriceDrag(handle, event, sliderElement);
  }

  handlePriceThumbKeydown(handle: PriceHandle, event: KeyboardEvent): void {
    const currentRange = this.filters().priceRange;
    const currentValue = currentRange[handle];
    let nextValue: number | null = null;

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        nextValue = currentValue - priceStep;
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        nextValue = currentValue + priceStep;
        break;
      case 'PageDown':
        nextValue = currentValue - priceStep * 10;
        break;
      case 'PageUp':
        nextValue = currentValue + priceStep * 10;
        break;
      case 'Home':
        nextValue = handle === 'min' ? 0 : currentRange.min;
        break;
      case 'End':
        nextValue = handle === 'min' ? currentRange.max : this.maxCatalogPrice;
        break;
      default:
        return;
    }

    event.preventDefault();
    this.activePriceHandle.set(handle);
    this.updatePriceField(handle, nextValue);
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  }

  @HostListener('window:pointermove', ['$event'])
  protected handlePricePointerMove(event: PointerEvent): void {
    const handle = this.activePriceHandle();

    if (!handle || !this.priceSliderElement) {
      return;
    }

    event.preventDefault();
    this.updatePriceFromPointer(handle, event, this.priceSliderElement);
  }

  @HostListener('window:pointerup')
  @HostListener('window:pointercancel')
  protected stopPricePointerDrag(): void {
    this.priceSliderElement = null;
    this.activePriceHandle.set(null);
  }

  private updatePriceField(field: keyof ProductPriceRange, value: number): void {
    this.filters.update((filters) => {
      const currentRange = filters.priceRange;
      const nextValue = Math.round(value / priceStep) * priceStep;
      const priceRange =
        field === 'min'
          ? {
              min: Math.min(Math.max(0, nextValue), currentRange.max),
              max: currentRange.max,
            }
          : {
              min: currentRange.min,
              max: Math.max(Math.min(nextValue, this.maxCatalogPrice), currentRange.min),
            };

      return {
        ...filters,
        priceRange,
      };
    });
    this.resetVisibleProducts();
  }

  private updatePriceFromPointer(
    handle: PriceHandle,
    event: PointerEvent,
    sliderElement: HTMLElement,
  ): void {
    this.updatePriceField(handle, this.priceValueFromPointer(event, sliderElement));
  }

  private priceValueFromPointer(event: PointerEvent, sliderElement: HTMLElement): number {
    const rect = sliderElement.getBoundingClientRect();
    const ratio =
      rect.width > 0 ? Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1) : 0;

    return ratio * this.maxCatalogPrice;
  }

  private closestPriceHandle(value: number): PriceHandle {
    const currentRange = this.filters().priceRange;
    const minDistance = Math.abs(value - currentRange.min);
    const maxDistance = Math.abs(value - currentRange.max);

    if (minDistance < maxDistance) {
      return 'min';
    }

    if (maxDistance < minDistance) {
      return 'max';
    }

    return this.activePriceHandle() ?? (value <= currentRange.min ? 'min' : 'max');
  }

  private normalizeCurrentPriceRange(): void {
    this.filters.update((filters) => ({
      ...filters,
      priceRange: this.normalizePriceRange(filters.priceRange),
    }));
    this.resetVisibleProducts();
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
    const routeCollection = this.collectionFromRoute();

    return {
      ...storedFilters,
      categoryId,
      collectionId: this.route.snapshot.queryParamMap.has('collection')
        ? routeCollection
        : (storedFilters.collectionId ?? 'all'),
      priceRange: this.normalizePriceRange(storedFilters.priceRange),
    };
  }

  private defaultFilters(): ProductFilters {
    return {
      searchTerm: '',
      categoryId: 'all',
      collectionId: 'all',
      sort: 'featured',
      priceRange: { min: 0, max: this.maxCatalogPrice },
    };
  }

  private collectionFromRoute(): ProductCollectionFilter {
    const collectionId = this.route.snapshot.queryParamMap.get('collection');
    const collection = this.collectionFilters.find((item) => item.id === collectionId);

    return collection?.id ?? 'all';
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
