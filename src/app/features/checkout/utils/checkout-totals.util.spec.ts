import { calculateCheckoutTotals } from './checkout-totals.util';

describe('calculateCheckoutTotals', () => {
  it('calculates standard delivery totals with rounded tax', () => {
    expect(calculateCheckoutTotals(1_899, 0, 'standard')).toEqual({
      subtotal: 1_899,
      discount: 0,
      shipping: 0,
      tax: 152,
      total: 2_051,
    });
  });

  it('applies express shipping after discount and tax', () => {
    expect(calculateCheckoutTotals(1_000, 100, 'express')).toEqual({
      subtotal: 1_000,
      discount: 100,
      shipping: 18,
      tax: 72,
      total: 990,
    });
  });

  it('clamps discounts to the subtotal', () => {
    expect(calculateCheckoutTotals(50, 100, 'standard')).toEqual({
      subtotal: 50,
      discount: 50,
      shipping: 0,
      tax: 0,
      total: 0,
    });
  });
});
