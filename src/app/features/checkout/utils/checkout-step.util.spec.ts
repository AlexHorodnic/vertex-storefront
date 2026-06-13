import { canVisitCheckoutStep } from './checkout-step.util';

describe('canVisitCheckoutStep', () => {
  it('always allows the cart and shipping steps', () => {
    const invalid = () => false;

    expect(canVisitCheckoutStep('cart', invalid)).toBe(true);
    expect(canVisitCheckoutStep('shipping', invalid)).toBe(true);
  });

  it('requires all shipping controls before payment', () => {
    expect(canVisitCheckoutStep('payment', () => true)).toBe(true);
    expect(canVisitCheckoutStep('payment', (control) => control !== 'email')).toBe(false);
  });

  it('requires payment controls before review', () => {
    expect(canVisitCheckoutStep('review', () => true)).toBe(true);
    expect(canVisitCheckoutStep('review', (control) => control !== 'cardNumber')).toBe(false);
  });
});
