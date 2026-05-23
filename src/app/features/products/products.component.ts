import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { CATALOG_CATEGORY_FILTERS } from '../../core/constants/storefront.constants';
import {
  ProductCategoryFilter,
  ProductFilters,
  ProductSort,
} from '../../core/models/product.model';
import { ProductService } from '../../core/services/product.service';
import { filterProducts } from '../../core/utils/product-filter.util';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ProductGridComponent } from '../../shared/components/product-grid/product-grid.component';
import { SectionHeaderComponent } from '../../shared/components/section-header/section-header.component';
import { SkeletonCardComponent } from '../../shared/components/skeleton-card/skeleton-card.component';

@Component({
  selector: 'app-products',
  imports: [
    FormsModule,
    EmptyStateComponent,
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

  protected readonly categoryFilters = CATALOG_CATEGORY_FILTERS;
  protected readonly sortOptions: readonly { value: ProductSort; label: string }[] = [
    { value: 'featured', label: 'Featured' },
    { value: 'price-low', label: 'Price: low to high' },
    { value: 'price-high', label: 'Price: high to low' },
    { value: 'rating', label: 'Top rated' },
  ];
  protected readonly filters = signal<ProductFilters>({
    searchTerm: '',
    categoryId: this.categoryFromRoute(),
    sort: 'featured',
  });
  protected readonly isLoading = signal(true);
  protected readonly isSortMenuOpen = signal(false);
  protected readonly selectedSortLabel = computed(
    () =>
      this.sortOptions.find((option) => option.value === this.filters().sort)?.label ??
      'Featured',
  );
  protected readonly filteredProducts = computed(() =>
    filterProducts(this.productService.products(), this.filters()),
  );

  constructor() {
    window.setTimeout(() => this.isLoading.set(false), 450);
  }

  updateSearch(searchTerm: string): void {
    this.filters.update((filters) => ({ ...filters, searchTerm }));
  }

  updateCategory(categoryId: ProductCategoryFilter): void {
    this.filters.update((filters) => ({ ...filters, categoryId }));
  }

  updateSort(sort: ProductSort): void {
    this.filters.update((filters) => ({ ...filters, sort }));
    this.isSortMenuOpen.set(false);
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

    return category?.id ?? 'all';
  }
}
