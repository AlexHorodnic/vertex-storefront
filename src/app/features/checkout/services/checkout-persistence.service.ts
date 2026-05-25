import { Injectable, inject } from '@angular/core';

import { StorageService } from '../../../core/services/storage.service';
import { DeliveryMethod, PersistedCheckoutShipping } from '../checkout.models';

const checkoutShippingKey = 'vertex-checkout-shipping';
const deliveryMethods: readonly DeliveryMethod[] = ['standard', 'express'];

@Injectable({ providedIn: 'root' })
export class CheckoutPersistenceService {
  private readonly storage = inject(StorageService);

  loadShipping(): PersistedCheckoutShipping | null {
    return this.storage.get<PersistedCheckoutShipping | null>(
      checkoutShippingKey,
      null,
      isPersistedCheckoutShipping,
    );
  }

  saveShipping(value: PersistedCheckoutShipping): void {
    this.storage.set(checkoutShippingKey, value);
  }

  clearShipping(): void {
    this.storage.remove(checkoutShippingKey);
  }
}

function isPersistedCheckoutShipping(value: unknown): value is PersistedCheckoutShipping {
  return (
    isRecord(value) &&
    typeof value['email'] === 'string' &&
    typeof value['phone'] === 'string' &&
    typeof value['phoneCountry'] === 'string' &&
    typeof value['phoneLocal'] === 'string' &&
    typeof value['firstName'] === 'string' &&
    typeof value['lastName'] === 'string' &&
    typeof value['address'] === 'string' &&
    typeof value['city'] === 'string' &&
    typeof value['postalCode'] === 'string' &&
    typeof value['country'] === 'string' &&
    isDeliveryMethod(value['deliveryMethod'])
  );
}

function isDeliveryMethod(value: unknown): value is DeliveryMethod {
  return typeof value === 'string' && deliveryMethods.includes(value as DeliveryMethod);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
