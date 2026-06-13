import { TestBed } from '@angular/core/testing';

import { installStorageMock } from '../../../../testing/storage.mock';
import { PersistedCheckoutShipping } from '../checkout.models';
import { CheckoutPersistenceService } from './checkout-persistence.service';

describe('CheckoutPersistenceService', () => {
  const shipping: PersistedCheckoutShipping = {
    email: 'alex@example.com',
    phone: '+30 6900000000',
    phoneCountry: 'GR',
    phoneLocal: '690 000 0000',
    firstName: 'Alex',
    lastName: 'Example',
    address: '1 Demo Street',
    city: 'Athens',
    postalCode: '10000',
    country: 'Greece',
    deliveryMethod: 'express',
  };

  beforeEach(() => {
    installStorageMock();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('round-trips validated shipping details', () => {
    const service = TestBed.inject(CheckoutPersistenceService);

    service.saveShipping(shipping);

    expect(service.loadShipping()).toEqual(shipping);
  });

  it('rejects malformed persisted checkout data', () => {
    window.localStorage.setItem(
      'vertex-checkout-shipping',
      JSON.stringify({ ...shipping, deliveryMethod: 'teleport' }),
    );

    expect(TestBed.inject(CheckoutPersistenceService).loadShipping()).toBeNull();
  });

  it('clears saved shipping details', () => {
    const service = TestBed.inject(CheckoutPersistenceService);
    service.saveShipping(shipping);

    service.clearShipping();

    expect(service.loadShipping()).toBeNull();
  });
});
