import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { ProductFilters, ProductSort } from '../../core/models/product.model';
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

  protected readonly categories = this.productService.categories;
  protected readonly filters = signal<ProductFilters>({
    searchTerm: '',
    categoryId: this.route.snapshot.queryParamMap.get('category') ?? 'all',
    sort: 'featured',
  });
  protected readonly isLoading = signal(true);
  protected readonly filteredProducts = computed(() =>
    filterProducts(this.productService.products(), this.filters()),
  );

  constructor() {
    window.setTimeout(() => this.isLoading.set(false), 450);
  }

  updateSearch(searchTerm: string): void {
    this.filters.update((filters) => ({ ...filters, searchTerm }));
  }

  updateCategory(categoryId: string): void {
    this.filters.update((filters) => ({ ...filters, categoryId }));
  }

  updateSort(sort: ProductSort): void {
    this.filters.update((filters) => ({ ...filters, sort }));
  }
}
