import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';

import { CartService } from '../../../core/services/cart.service';
import { CartItem } from '../../../core/models/cart.model';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { CheckoutFormComponent } from '../components/checkout-form/checkout-form.component';
import { CheckoutSuccessComponent } from '../components/checkout-success/checkout-success.component';
import { OrderSummaryComponent } from '../components/order-summary/order-summary.component';
import {
  CheckoutConfirmation,
  CheckoutStep,
  DeliveryMethod,
  PersistedCheckoutShipping,
} from '../checkout.models';
import { CheckoutPersistenceService } from '../services/checkout-persistence.service';

const taxRate = 0.08;
const expressShipping = 18;

@Component({
  selector: 'app-checkout-page',
  imports: [
    RouterLink,
    EmptyStateComponent,
    CheckoutFormComponent,
    CheckoutSuccessComponent,
    OrderSummaryComponent,
  ],
  templateUrl: './checkout-page.component.html',
  styleUrl: './checkout-page.component.scss',
})
export class CheckoutPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly cartService = inject(CartService);
  private readonly checkoutPersistence = inject(CheckoutPersistenceService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly items = this.cartService.items;
  protected readonly selectedDelivery = signal<DeliveryMethod>('standard');
  protected readonly promoDiscount = signal(0);
  protected readonly hasSavedShippingData = signal(false);
  protected readonly isPlacingOrder = signal(false);
  protected readonly confirmation = signal<CheckoutConfirmation | null>(null);
  protected readonly currentStep = signal<CheckoutStep>('cart');
  protected readonly checkoutSteps: readonly { id: CheckoutStep; label: string }[] = [
    { id: 'cart', label: 'Cart' },
    { id: 'shipping', label: 'Shipping' },
    { id: 'payment', label: 'Payment' },
    { id: 'review', label: 'Review' },
  ];

  protected readonly checkoutForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    phoneCountry: ['US', Validators.required],
    phoneLocal: [
      '',
      [Validators.required, Validators.minLength(6), Validators.pattern(/^[0-9 ]+$/)],
    ],
    phone: ['+1 ', [Validators.required, Validators.pattern(/^\+\d{1,4}\s\d[\d\s]{5,17}$/)]],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    address: ['', Validators.required],
    city: ['', Validators.required],
    postalCode: ['', Validators.required],
    country: ['United States', Validators.required],
    deliveryMethod: ['standard' as DeliveryMethod, Validators.required],
    cardholderName: ['', Validators.required],
    cardNumber: ['', [Validators.required, Validators.pattern(/^\d{4} \d{4} \d{4} \d{4}$/)]],
    expiry: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
    cvc: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
    reviewOrder: [false, Validators.requiredTrue],
    promoCode: [''],
  });

  protected readonly totals = computed(() => {
    const subtotal = this.cartService.totals().subtotal;
    const discount = Math.min(this.promoDiscount(), subtotal);
    const taxableSubtotal = Math.max(subtotal - discount, 0);
    const shipping = this.selectedDelivery() === 'express' ? expressShipping : 0;
    const tax = Math.round(taxableSubtotal * taxRate);

    return {
      subtotal,
      discount,
      shipping,
      tax,
      total: taxableSubtotal + shipping + tax,
    };
  });

  protected readonly currentStepNumber = computed(() => this.stepIndex(this.currentStep()) + 1);
  protected readonly currentStepLabel = computed(
    () => this.checkoutSteps[this.currentStepNumber() - 1]?.label ?? 'Checkout',
  );

  constructor() {
    this.restoreShippingData();

    this.checkoutForm.controls.deliveryMethod.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((method) => {
        this.selectedDelivery.set(method);
      });

    this.checkoutForm.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.checkoutPersistence.saveShipping(this.shippingSnapshot());
        this.hasSavedShippingData.set(true);
      });
  }

  protected applyPromoDiscount(discount: number): void {
    this.promoDiscount.set(discount);
  }

  protected placeOrder(): void {
    if (this.isPlacingOrder()) {
      return;
    }

    if (this.checkoutForm.invalid || this.items().length === 0) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    this.isPlacingOrder.set(true);
    const orderItems = [...this.items()];
    const orderTotals = this.totals();

    globalThis.setTimeout(() => {
      this.confirmation.set({
        orderNumber: this.createOrderNumber(),
        estimatedDelivery: this.estimatedDeliveryLabel(),
        items: orderItems,
        totals: orderTotals,
      });

      this.cartService.clearCart();
      this.checkoutPersistence.clearShipping();
      this.hasSavedShippingData.set(false);
      this.isPlacingOrder.set(false);
      this.scrollCheckoutToTop();
    }, 850);
  }

  protected setStep(step: CheckoutStep): void {
    if (this.canVisitStep(step)) {
      this.currentStep.set(step);
      this.scrollCheckoutToTop();
    }
  }

  protected canVisitStep(step: CheckoutStep): boolean {
    if (step === 'cart' || step === 'shipping') {
      return true;
    }

    if (step === 'payment') {
      return this.stepControlsValid([
        'email',
        'phoneCountry',
        'phoneLocal',
        'phone',
        'firstName',
        'lastName',
        'address',
        'city',
        'postalCode',
        'country',
        'deliveryMethod',
      ]);
    }

    return this.stepControlsValid([
      'email',
      'phoneCountry',
      'phoneLocal',
      'phone',
      'firstName',
      'lastName',
      'address',
      'city',
      'postalCode',
      'country',
      'deliveryMethod',
      'cardholderName',
      'cardNumber',
      'expiry',
      'cvc',
    ]);
  }

  protected stepState(step: CheckoutStep): string {
    const currentIndex = this.stepIndex(this.currentStep());
    const stepIndex = this.stepIndex(step);

    if (stepIndex < currentIndex) {
      return 'is-complete';
    }

    if (stepIndex === currentIndex) {
      return 'is-current';
    }

    return this.canVisitStep(step) ? 'is-available' : '';
  }

  protected variantLabel(item: CartItem): string {
    return (
      item.product.variants.find((variant) => variant.id === item.variantId)?.value ?? 'Standard'
    );
  }

  protected estimatedDeliveryLabel(): string {
    const daysToAdd = this.selectedDelivery() === 'express' ? 2 : 4;
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + daysToAdd);

    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(deliveryDate);
  }

  private createOrderNumber(): string {
    return `VX-${Date.now().toString().slice(-6)}`;
  }

  private stepIndex(step: CheckoutStep): number {
    return this.checkoutSteps.findIndex((checkoutStep) => checkoutStep.id === step);
  }

  private stepControlsValid(controlNames: readonly string[]): boolean {
    return controlNames.every((controlName) => this.checkoutForm.get(controlName)?.valid);
  }

  private restoreShippingData(): void {
    const savedShipping = this.checkoutPersistence.loadShipping();

    if (!savedShipping) {
      return;
    }

    this.checkoutForm.patchValue(savedShipping, { emitEvent: false });

    this.selectedDelivery.set(savedShipping.deliveryMethod);
    this.hasSavedShippingData.set(true);
  }

  private shippingSnapshot(): PersistedCheckoutShipping {
    const rawValue = this.checkoutForm.getRawValue();

    return {
      email: rawValue.email,
      phone: rawValue.phone,
      phoneCountry: rawValue.phoneCountry,
      phoneLocal: rawValue.phoneLocal,
      firstName: rawValue.firstName,
      lastName: rawValue.lastName,
      address: rawValue.address,
      city: rawValue.city,
      postalCode: rawValue.postalCode,
      country: rawValue.country,
      deliveryMethod: rawValue.deliveryMethod,
    };
  }

  private scrollCheckoutToTop(): void {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    window.requestAnimationFrame(() => {
      const checkoutPage = document.querySelector('.checkout-page');
      const top =
        checkoutPage instanceof HTMLElement
          ? checkoutPage.getBoundingClientRect().top + window.scrollY
          : 0;

      window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
    });
  }
}
