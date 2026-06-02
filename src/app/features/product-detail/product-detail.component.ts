import {
  AfterViewInit,
  Component,
  HostListener,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
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
import { IconComponent, IconName } from '../../shared/components/icon/icon.component';

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
export class ProductDetailComponent implements AfterViewInit, OnDestroy {
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
  protected readonly showStickyPurchase = signal(false);
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
  protected readonly selectedVariantLabel = computed(() => {
    const product = this.product();
    const variantId = this.selectedVariantId() || product?.variants[0]?.id;
    const variant = product?.variants.find((item) => item.id === variantId);

    return variant?.value ?? '';
  });
  protected readonly reviews = [
    {
      initials: 'AK',
      name: 'Alex K.',
      role: 'Verified purchase',
      rating: '5.0',
      comment:
        'The product arrived fast and feels exactly like the photos. Packaging, finish, and setup all felt premium.',
    },
    {
      initials: 'MR',
      name: 'Maya R.',
      role: 'Verified purchase',
      rating: '4.9',
      comment:
        'Clean design, reliable performance, and the details are better than most tech stores I have used.',
    },
    {
      initials: 'DN',
      name: 'Dimitris N.',
      role: 'Verified purchase',
      rating: '5.0',
      comment:
        'Great fit for my desk setup. The product recommendations and specs made comparison easy.',
    },
    {
      initials: 'SL',
      name: 'Sofia L.',
      role: 'Verified purchase',
      rating: '4.8',
      comment:
        'Support answered a setup question quickly and delivery tracking was clear from order to arrival.',
    },
  ] as const;
  protected readonly deliveryTrustItems: readonly {
    icon: IconName;
    title: string;
    description: string;
  }[] = [
    {
      icon: 'package',
      title: 'Ships tomorrow',
      description: 'Tracked dispatch on in-stock items.',
    },
    { icon: 'refresh', title: 'Free returns', description: '30-day returns on eligible products.' },
    { icon: 'shield', title: '2-year warranty', description: 'Coverage with Vertex support.' },
    { icon: 'card', title: 'Secure checkout', description: 'Encrypted card and wallet payments.' },
    {
      icon: 'headset',
      title: 'Support available',
      description: 'Setup help from the Vertex team.',
    },
    {
      icon: 'map-pin',
      title: 'Athens warehouse',
      description: 'Regional availability for faster delivery.',
    },
  ];
  private lightboxSwipeStartX: number | null = null;
  private lightboxSwipeStartY: number | null = null;
  private readonly lightboxSwipeThreshold = 48;
  private lightboxScrollY = 0;

  ngAfterViewInit(): void {
    window.requestAnimationFrame(() => this.updateStickyPurchaseVisibility());
  }

  ngOnDestroy(): void {
    this.unlockLightboxScroll();
  }

  selectImage(imageUrl: string): void {
    this.selectedImage.set(imageUrl);
  }

  openLightbox(imageUrl: string): void {
    this.selectImage(imageUrl);
    this.isLightboxOpen.set(true);
    this.lockLightboxScroll();
  }

  closeLightbox(): void {
    this.isLightboxOpen.set(false);
    this.unlockLightboxScroll();
    this.resetLightboxSwipe();
  }

  showPreviousImage(): void {
    this.showImageByOffset(-1);
  }

  showNextImage(): void {
    this.showImageByOffset(1);
  }

  startLightboxSwipe(event: PointerEvent): void {
    if (!this.isLightboxOpen() || event.pointerType === 'mouse') {
      return;
    }

    event.preventDefault();
    this.lightboxSwipeStartX = event.clientX;
    this.lightboxSwipeStartY = event.clientY;

    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  }

  finishLightboxSwipe(event: PointerEvent): void {
    if (this.lightboxSwipeStartX === null || this.lightboxSwipeStartY === null) {
      return;
    }

    const deltaX = event.clientX - this.lightboxSwipeStartX;
    const deltaY = event.clientY - this.lightboxSwipeStartY;
    this.resetLightboxSwipe();

    if (Math.abs(deltaX) < this.lightboxSwipeThreshold || Math.abs(deltaY) > Math.abs(deltaX) * 0.75) {
      return;
    }

    if (deltaX < 0) {
      this.showNextImage();
      return;
    }

    this.showPreviousImage();
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

  @HostListener('window:scroll')
  @HostListener('window:resize')
  updateStickyPurchaseVisibility(): void {
    const purchasePanel = document.querySelector('.purchase-panel');

    if (!(purchasePanel instanceof HTMLElement)) {
      this.showStickyPurchase.set(false);
      return;
    }

    this.showStickyPurchase.set(purchasePanel.getBoundingClientRect().bottom < 0);
  }

  stockClass(): string {
    const product = this.product();
    return product ? stockStatusClass(product) : 'stock-status';
  }

  specIcon(label: string): IconName {
    const normalizedLabel = label.toLowerCase();

    if (
      normalizedLabel.includes('display') ||
      normalizedLabel.includes('resolution') ||
      normalizedLabel.includes('refresh') ||
      normalizedLabel.includes('color')
    ) {
      return 'monitor';
    }

    if (
      normalizedLabel.includes('memory') ||
      normalizedLabel.includes('graphics') ||
      normalizedLabel.includes('sensor') ||
      normalizedLabel.includes('processor')
    ) {
      return 'chip';
    }

    if (normalizedLabel.includes('storage')) {
      return 'drive';
    }

    if (normalizedLabel.includes('battery') || normalizedLabel.includes('charging')) {
      return 'battery';
    }

    if (
      normalizedLabel.includes('connection') ||
      normalizedLabel.includes('connectivity') ||
      normalizedLabel.includes('ports') ||
      normalizedLabel.includes('sync') ||
      normalizedLabel.includes('pairing')
    ) {
      return 'plug';
    }

    if (
      normalizedLabel.includes('audio') ||
      normalizedLabel.includes('drivers') ||
      normalizedLabel.includes('microphones')
    ) {
      return 'speaker';
    }

    if (
      normalizedLabel.includes('gps') ||
      normalizedLabel.includes('training') ||
      normalizedLabel.includes('response')
    ) {
      return 'gauge';
    }

    return 'spec';
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

  private lockLightboxScroll(): void {
    if (document.body.classList.contains('lightbox-open')) {
      return;
    }

    this.lightboxScrollY = window.scrollY;
    document.body.style.top = `-${this.lightboxScrollY}px`;
    document.body.classList.add('lightbox-open');
  }

  private unlockLightboxScroll(): void {
    if (!document.body.classList.contains('lightbox-open')) {
      return;
    }

    document.body.classList.remove('lightbox-open');
    document.body.style.top = '';
    window.scrollTo({ top: this.lightboxScrollY, behavior: 'instant' });
  }

  private resetLightboxSwipe(): void {
    this.lightboxSwipeStartX = null;
    this.lightboxSwipeStartY = null;
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
