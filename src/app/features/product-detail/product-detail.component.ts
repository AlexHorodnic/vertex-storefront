import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { CartService } from '../../core/services/cart.service';
import { ProductService } from '../../core/services/product.service';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PriceComponent } from '../../shared/components/price/price.component';
import { ProductGridComponent } from '../../shared/components/product-grid/product-grid.component';
import { QuantitySelectorComponent } from '../../shared/components/quantity-selector/quantity-selector.component';
import { RatingComponent } from '../../shared/components/rating/rating.component';

@Component({
  selector: 'app-product-detail',
  imports: [
    RouterLink,
    BadgeComponent,
    EmptyStateComponent,
    PriceComponent,
    ProductGridComponent,
    QuantitySelectorComponent,
    RatingComponent,
  ],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);

  protected readonly product = computed(() =>
    this.productService.getProductBySlug(this.route.snapshot.paramMap.get('slug') ?? ''),
  );
  protected readonly selectedImage = signal('');
  protected readonly selectedVariantId = signal('');
  protected readonly quantity = signal(1);
  protected readonly relatedProducts = computed(() => {
    const product = this.product();
    return product ? this.productService.getRelatedProducts(product) : [];
  });

  selectImage(imageUrl: string): void {
    this.selectedImage.set(imageUrl);
  }

  selectVariant(variantId: string): void {
    this.selectedVariantId.set(variantId);
  }

  updateQuantity(quantity: number): void {
    this.quantity.set(quantity);
  }

  addToCart(): void {
    const product = this.product();
    const variantId =
      this.selectedVariantId() || product?.variants.find((variant) => variant.inStock)?.id;

    if (product && variantId) {
      this.cartService.addItem(product, variantId, this.quantity());
    }
  }
}
