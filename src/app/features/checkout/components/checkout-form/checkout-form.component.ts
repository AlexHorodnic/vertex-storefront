import { CurrencyPipe } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { CheckoutStep, DeliveryMethod } from '../../checkout.models';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { StripeExpressCheckoutComponent } from '../stripe-express-checkout/stripe-express-checkout.component';

@Component({
  selector: 'app-checkout-form',
  imports: [CurrencyPipe, ReactiveFormsModule, IconComponent, StripeExpressCheckoutComponent],
  templateUrl: './checkout-form.component.html',
  styleUrl: './checkout-form.component.scss',
})
export class CheckoutFormComponent implements OnInit {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly form = input.required<FormGroup>();
  readonly subtotal = input.required<number>();
  readonly total = input.required<number>();
  readonly discount = input(0);
  readonly selectedDelivery = input.required<DeliveryMethod>();
  readonly estimatedDelivery = input.required<string>();
  readonly currentStep = input.required<CheckoutStep>();
  readonly shippingDataSaved = input(false);
  readonly isPlacingOrder = input(false);
  readonly stepChange = output<CheckoutStep>();
  readonly placeOrder = output<void>();
  readonly walletPaymentSuccess = output<void>();
  protected readonly submitAttempted = signal(false);

  protected readonly shippingControls = [
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
  ] as const;

  protected readonly paymentControls = ['cardholderName', 'cardNumber', 'expiry', 'cvc'] as const;
  protected readonly phoneCountries: readonly PhoneCountry[] = [
    { iso: 'GR', flag: '🇬🇷', name: 'Greece', dialCode: '+30' },
    { iso: 'US', flag: '🇺🇸', name: 'United States', dialCode: '+1' },
    { iso: 'RO', flag: '🇷🇴', name: 'Romania', dialCode: '+40' },
    { iso: 'DE', flag: '🇩🇪', name: 'Germany', dialCode: '+49' },
    { iso: 'FR', flag: '🇫🇷', name: 'France', dialCode: '+33' },
    { iso: 'GB', flag: '🇬🇧', name: 'United Kingdom', dialCode: '+44' },
  ];
  protected readonly addressCountries: readonly AddressCountry[] = [
    { iso: 'US', flag: '🇺🇸', name: 'United States' },
    { iso: 'GR', flag: '🇬🇷', name: 'Greece' },
    { iso: 'RO', flag: '🇷🇴', name: 'Romania' },
    { iso: 'DE', flag: '🇩🇪', name: 'Germany' },
    { iso: 'FR', flag: '🇫🇷', name: 'France' },
    { iso: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
  ];
  protected readonly isCountryMenuOpen = signal(false);
  protected readonly isAddressCountryMenuOpen = signal(false);
  protected readonly activeCountryIndex = signal(0);
  protected readonly activeAddressCountryIndex = signal(0);

  ngOnInit(): void {
    if (this.hasPhoneProgress()) {
      this.activeCountryIndex.set(this.selectedCountryIndex());
      this.syncPhoneValue();
      return;
    }

    const defaultCountry = this.detectDefaultPhoneCountry();
    this.applyPhoneCountry(defaultCountry.iso);
  }

  @HostListener('document:click', ['$event'])
  protected closeCountryMenuOnOutsideClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.closeCountryMenu();
      this.closeAddressCountryMenu();
    }
  }

  protected isInvalid(controlName: string): boolean {
    const control = this.form().get(controlName);

    return Boolean(control?.invalid && (control.touched || this.submitAttempted()));
  }

  protected errorFor(controlName: string, label: string): string {
    const control = this.form().get(controlName);

    if (control?.hasError('required')) {
      return `${label} is required.`;
    }

    if (control?.hasError('email')) {
      return 'Enter a valid email address.';
    }

    if (control?.hasError('pattern')) {
      return `Enter a valid ${label.toLowerCase()}.`;
    }

    if (control?.hasError('minlength')) {
      return label === 'Phone number' ? 'Enter a valid phone number.' : `${label} looks too short.`;
    }

    return `${label} is invalid.`;
  }

  protected submit(): void {
    if (this.currentStep() === 'review') {
      this.submitAttempted.set(true);
      this.placeOrder.emit();
      return;
    }

    this.nextStep();
  }

  protected nextStep(): void {
    if (this.currentStep() === 'cart') {
      this.stepChange.emit('shipping');
      return;
    }

    if (this.currentStep() === 'shipping') {
      if (!this.validateControls(this.shippingControls)) {
        this.submitAttempted.set(true);
        return;
      }

      this.submitAttempted.set(false);
      this.stepChange.emit('payment');
      return;
    }

    if (this.currentStep() === 'payment') {
      if (!this.validateControls(this.paymentControls)) {
        this.submitAttempted.set(true);
        return;
      }

      this.submitAttempted.set(false);
      this.stepChange.emit('review');
    }
  }

  protected previousStep(): void {
    const step = this.currentStep();

    if (step === 'shipping') {
      this.stepChange.emit('cart');
    } else if (step === 'payment') {
      this.stepChange.emit('shipping');
    } else if (step === 'review') {
      this.stepChange.emit('payment');
    }
  }

  protected selectedPhoneCountry(): PhoneCountry {
    const iso = this.form().get('phoneCountry')?.value as string;

    return this.phoneCountries.find((country) => country.iso === iso) ?? this.phoneCountries[1];
  }

  protected selectedPhoneCountryLabel(): string {
    const country = this.selectedPhoneCountry();

    return `${country.flag} ${country.name} (${country.dialCode})`;
  }

  protected fieldValue(controlName: string): string {
    return String(this.form().get(controlName)?.value ?? '').trim();
  }

  protected deliveryLabel(): string {
    return this.selectedDelivery() === 'express' ? 'Express delivery' : 'Standard delivery';
  }

  protected deliveryDescription(): string {
    return this.selectedDelivery() === 'express'
      ? 'Priority 1-2 business days'
      : 'Tracked 2-4 business days';
  }

  protected maskedCardNumber(): string {
    const cardNumber = this.fieldValue('cardNumber').replace(/\D/g, '');
    const lastFour = cardNumber.slice(-4) || '4242';

    return `Visa ending in ${lastFour}`;
  }

  protected editStep(step: CheckoutStep): void {
    this.stepChange.emit(step);
  }

  protected canContinue(): boolean {
    if (this.currentStep() === 'cart') {
      return true;
    }

    if (this.currentStep() === 'shipping') {
      return this.controlsValid(this.shippingControls);
    }

    if (this.currentStep() === 'payment') {
      return this.controlsValid(this.paymentControls);
    }

    return this.form().valid;
  }

  protected applyPhoneCountry(iso: string): void {
    const country = this.phoneCountries.find((item) => item.iso === iso) ?? this.phoneCountries[1];
    this.form().get('phoneCountry')?.setValue(country.iso);
    this.activeCountryIndex.set(this.selectedCountryIndex());
    this.syncPhoneValue();
  }

  protected toggleCountryMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.activeCountryIndex.set(this.selectedCountryIndex());
    this.isCountryMenuOpen.update((isOpen) => !isOpen);
  }

  protected closeCountryMenu(): void {
    this.isCountryMenuOpen.set(false);
  }

  protected closeAddressCountryMenu(): void {
    this.isAddressCountryMenuOpen.set(false);
  }

  protected selectPhoneCountry(country: PhoneCountry): void {
    this.applyPhoneCountry(country.iso);
    this.closeCountryMenu();
  }

  protected selectedAddressCountry(): AddressCountry {
    const countryName = this.form().get('country')?.value as string;

    return (
      this.addressCountries.find((country) => country.name === countryName) ??
      this.addressCountries[0]
    );
  }

  protected toggleAddressCountryMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.activeAddressCountryIndex.set(this.selectedAddressCountryIndex());
    this.isAddressCountryMenuOpen.update((isOpen) => !isOpen);
  }

  protected selectAddressCountry(country: AddressCountry): void {
    const control = this.form().get('country');
    control?.setValue(country.name);
    control?.markAsTouched();
    this.activeAddressCountryIndex.set(this.selectedAddressCountryIndex());
    this.closeAddressCountryMenu();
  }

  protected countryFlag(country: { readonly iso: string }): string {
    return country.iso
      .toUpperCase()
      .replace(/./g, (character) => String.fromCodePoint(127397 + character.charCodeAt(0)));
  }

  protected handleCountryTriggerKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.isCountryMenuOpen.set(true);
      this.moveActiveCountry(event.key === 'ArrowDown' ? 1 : -1);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.isCountryMenuOpen.set(true);
      return;
    }

    if (event.key === 'Escape') {
      this.closeCountryMenu();
    }
  }

  protected handleCountryOptionKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.moveActiveCountry(event.key === 'ArrowDown' ? 1 : -1);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectPhoneCountry(this.phoneCountries[this.activeCountryIndex()]);
      return;
    }

    if (event.key === 'Escape') {
      this.closeCountryMenu();
    }
  }

  protected handleAddressCountryTriggerKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.isAddressCountryMenuOpen.set(true);
      this.moveActiveAddressCountry(event.key === 'ArrowDown' ? 1 : -1);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.isAddressCountryMenuOpen.set(true);
      return;
    }

    if (event.key === 'Escape') {
      this.closeAddressCountryMenu();
    }
  }

  protected handleAddressCountryOptionKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.moveActiveAddressCountry(event.key === 'ArrowDown' ? 1 : -1);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectAddressCountry(this.addressCountries[this.activeAddressCountryIndex()]);
      return;
    }

    if (event.key === 'Escape') {
      this.closeAddressCountryMenu();
    }
  }

  protected formatPhoneLocal(event: Event): void {
    const input = event.target as HTMLInputElement;
    const country = this.selectedPhoneCountry();
    const digitsOnly = input.value.replace(country.dialCode, '').replace(/\D/g, '').slice(0, 15);
    const formattedValue = digitsOnly.replace(/(\d{3})(?=\d)/g, '$1 ').trim();

    this.form().get('phoneLocal')?.setValue(formattedValue, { emitEvent: false });
    this.syncPhoneValue();
  }

  protected formatCardNumber(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formattedValue = input.value
      .replace(/\D/g, '')
      .slice(0, 19)
      .replace(/(.{4})/g, '$1 ')
      .trim();

    this.form().get('cardNumber')?.setValue(formattedValue, { emitEvent: false });
  }

  protected formatExpiry(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '').slice(0, 4);
    const formattedValue = value.length > 2 ? `${value.slice(0, 2)}/${value.slice(2)}` : value;

    this.form().get('expiry')?.setValue(formattedValue, { emitEvent: false });
  }

  private validateControls(controlNames: readonly string[]): boolean {
    this.syncPhoneValue();
    controlNames.forEach((controlName) => this.form().get(controlName)?.markAsTouched());

    return this.controlsValid(controlNames);
  }

  private controlsValid(controlNames: readonly string[]): boolean {
    return controlNames.every((controlName) => this.form().get(controlName)?.valid);
  }

  private syncPhoneValue(): void {
    const country = this.selectedPhoneCountry();
    const localNumber = String(this.form().get('phoneLocal')?.value ?? '')
      .replace(country.dialCode, '')
      .replace(/\D/g, '')
      .replace(/(\d{3})(?=\d)/g, '$1 ')
      .trim();

    this.form().get('phone')?.setValue(`${country.dialCode} ${localNumber}`.trim(), {
      emitEvent: false,
    });
  }

  private hasPhoneProgress(): boolean {
    const phone = String(this.form().get('phone')?.value ?? '').trim();
    const phoneLocal = String(this.form().get('phoneLocal')?.value ?? '').trim();

    return phoneLocal.length > 0 || (phone.length > 0 && phone !== '+1');
  }

  private moveActiveCountry(delta: number): void {
    const nextIndex =
      (this.activeCountryIndex() + delta + this.phoneCountries.length) % this.phoneCountries.length;
    this.activeCountryIndex.set(nextIndex);
  }

  private moveActiveAddressCountry(delta: number): void {
    const nextIndex =
      (this.activeAddressCountryIndex() + delta + this.addressCountries.length) %
      this.addressCountries.length;
    this.activeAddressCountryIndex.set(nextIndex);
  }

  private selectedCountryIndex(): number {
    const selectedIndex = this.phoneCountries.findIndex(
      (country) => country.iso === this.selectedPhoneCountry().iso,
    );

    return Math.max(selectedIndex, 0);
  }

  private selectedAddressCountryIndex(): number {
    const selectedIndex = this.addressCountries.findIndex(
      (country) => country.name === this.selectedAddressCountry().name,
    );

    return Math.max(selectedIndex, 0);
  }

  private detectDefaultPhoneCountry(): PhoneCountry {
    const locale = globalThis.navigator?.language?.toUpperCase() ?? '';
    const countryCode = locale.split('-').at(-1);

    return (
      this.phoneCountries.find((country) => country.iso === countryCode) ??
      this.phoneCountries.find((country) => country.iso === 'US') ??
      this.phoneCountries[0]
    );
  }
}

interface PhoneCountry {
  readonly iso: string;
  readonly flag: string;
  readonly name: string;
  readonly dialCode: string;
}

interface AddressCountry {
  readonly iso: string;
  readonly flag: string;
  readonly name: string;
}
