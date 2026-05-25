import { CartItem } from '../../core/models/cart.model';

export interface CheckoutTotals {
  readonly subtotal: number;
  readonly discount: number;
  readonly shipping: number;
  readonly tax: number;
  readonly total: number;
}

export interface CheckoutConfirmation {
  readonly orderNumber: string;
  readonly estimatedDelivery: string;
  readonly items: readonly CartItem[];
  readonly totals: CheckoutTotals;
}

export type DeliveryMethod = 'standard' | 'express';

export type CheckoutStep = 'cart' | 'shipping' | 'payment' | 'review';

export interface PaymentMethodLogo {
  readonly id: string;
  readonly name: string;
  readonly iconPath: string;
}

export interface PersistedCheckoutShipping {
  readonly email: string;
  readonly phone: string;
  readonly phoneCountry: string;
  readonly phoneLocal: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly address: string;
  readonly city: string;
  readonly postalCode: string;
  readonly country: string;
  readonly deliveryMethod: DeliveryMethod;
}
