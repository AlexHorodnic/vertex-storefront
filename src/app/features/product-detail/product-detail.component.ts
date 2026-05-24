import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { CartService } from '../../core/services/cart.service';
import { ProductService } from '../../core/services/product.service';
import { StorageService } from '../../core/services/storage.service';
import { stockStatusClass } from '../../core/utils/stock-status.util';
import { isVariantSelectionMap } from '../../core/utils/storage-guards.util';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PriceComponent } from '../../shared/components/price/price.component';
import { ProductGridComponent } from '../../shared/components/product-grid/product-grid.component';
import { QuantitySelectorComponent } from '../../shared/components/quantity-selector/quantity-selector.component';
import { RatingComponent } from '../../shared/components/rating/rating.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

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
    IconComponent,
  ],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);
  private readonly storageService = inject(StorageService);

  protected readonly product = computed(() =>
    this.productService.getProductBySlug(this.route.snapshot.paramMap.get('slug') ?? ''),
  );
  protected readonly selectedImage = signal('');
  protected readonly isLightboxOpen = signal(false);
  protected readonly selectedVariantId = signal(this.storedVariantId());
  protected readonly quantity = signal(1);
  protected readonly paymentMethods = [
    { id: 'visa', name: 'Visa', iconPath: '/assets/icons/payment/visa.svg' },
    { id: 'mastercard', name: 'Mastercard', iconPath: '/assets/icons/payment/mastercard.svg' },
    { id: 'paypal', name: 'PayPal', iconPath: '/assets/icons/payment/paypal.svg' },
    { id: 'applepay', name: 'Apple Pay', iconPath: '/assets/icons/payment/applepay.svg' },
    { id: 'googlepay', name: 'Google Pay', iconPath: '/assets/icons/payment/googlepay.svg' },
    { id: 'klarna', name: 'Klarna', iconPath: '/assets/icons/payment/klarna.svg' },
  ] as const;
  protected readonly relatedProducts = computed(() => {
    const product = this.product();
    return product ? this.productService.getRelatedProducts(product) : [];
  });

  selectImage(imageUrl: string): void {
    this.selectedImage.set(imageUrl);
  }

  openLightbox(imageUrl: string): void {
    this.selectImage(imageUrl);
    this.isLightboxOpen.set(true);
  }

  closeLightbox(): void {
    this.isLightboxOpen.set(false);
  }

  showPreviousImage(): void {
    this.showImageByOffset(-1);
  }

  showNextImage(): void {
    this.showImageByOffset(1);
  }

  @HostListener('document:keydown', ['$event'])
  handleDocumentKeydown(event: KeyboardEvent): void {
    if (!this.isLightboxOpen()) {
      return;
    }

    if (event.key === 'Escape') {
      this.closeLightbox();
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.showPreviousImage();
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.showNextImage();
    }
  }

  selectVariant(variantId: string): void {
    this.selectedVariantId.set(variantId);
    this.persistVariant(variantId);
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

  stockClass(): string {
    const product = this.product();
    return product ? stockStatusClass(product) : 'stock-status';
  }

  private showImageByOffset(offset: number): void {
    const product = this.product();

    if (!product?.gallery.length) {
      return;
    }

    const currentImage = this.selectedImage() || product.gallery[0];
    const currentIndex = product.gallery.findIndex((image) => image === currentImage);
    const nextIndex =
      ((currentIndex >= 0 ? currentIndex : 0) + offset + product.gallery.length) %
      product.gallery.length;

    this.selectedImage.set(product.gallery[nextIndex]);
  }

  private storedVariantId(): string {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    const selections = this.storageService.get<Record<string, string>>(
      'vertex:selectedVariants',
      {},
      isVariantSelectionMap,
    );

    const variantId = selections[slug] ?? '';
    const product = this.productService.getProductBySlug(slug);
    const variant = product?.variants.find((item) => item.id === variantId && item.inStock);

    return variant?.id ?? '';
  }

  private persistVariant(variantId: string): void {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';

    if (!slug) {
      return;
    }

    const selections = this.storageService.get<Record<string, string>>(
      'vertex:selectedVariants',
      {},
      isVariantSelectionMap,
    );

    this.storageService.set('vertex:selectedVariants', { ...selections, [slug]: variantId });
  }
}
