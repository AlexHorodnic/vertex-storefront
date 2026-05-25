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

@Component({
  selector: 'app-checkout-form',
  imports: [CurrencyPipe, ReactiveFormsModule, IconComponent],
  templateUrl: './checkout-form.component.html',
  styleUrl: './checkout-form.component.scss',
})
export class CheckoutFormComponent implements OnInit {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly form = input.required<FormGroup>();
  readonly subtotal = input.required<number>();
  readonly selectedDelivery = input.required<DeliveryMethod>();
  readonly currentStep = input.required<CheckoutStep>();
  readonly stepChange = output<CheckoutStep>();
  readonly placeOrder = output<void>();

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
  protected readonly isCountryMenuOpen = signal(false);
  protected readonly activeCountryIndex = signal(0);

  ngOnInit(): void {
    const defaultCountry = this.detectDefaultPhoneCountry();
    this.applyPhoneCountry(defaultCountry.iso);
  }

  @HostListener('document:click', ['$event'])
  protected closeCountryMenuOnOutsideClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.closeCountryMenu();
    }
  }

  protected isInvalid(controlName: string): boolean {
    const control = this.form().get(controlName);

    return Boolean(control?.invalid && (control.touched || control.dirty));
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
        return;
      }

      this.stepChange.emit('payment');
      return;
    }

    if (this.currentStep() === 'payment') {
      if (!this.validateControls(this.paymentControls)) {
        return;
      }

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

  protected selectPhoneCountry(country: PhoneCountry): void {
    this.applyPhoneCountry(country.iso);
    this.closeCountryMenu();
  }

  protected countryFlag(country: PhoneCountry): string {
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

  private moveActiveCountry(delta: number): void {
    const nextIndex =
      (this.activeCountryIndex() + delta + this.phoneCountries.length) % this.phoneCountries.length;
    this.activeCountryIndex.set(nextIndex);
  }

  private selectedCountryIndex(): number {
    const selectedIndex = this.phoneCountries.findIndex(
      (country) => country.iso === this.selectedPhoneCountry().iso,
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
