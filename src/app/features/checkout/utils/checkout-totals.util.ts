import { CheckoutTotals, DeliveryMethod } from '../checkout.models';

const taxRate = 0.08;
const expressShipping = 18;

export function calculateCheckoutTotals(
  subtotal: number,
  promoDiscount: number,
  deliveryMethod: DeliveryMethod,
): CheckoutTotals {
  const discount = Math.min(Math.max(promoDiscount, 0), subtotal);
  const taxableSubtotal = Math.max(subtotal - discount, 0);
  const shipping = deliveryMethod === 'express' ? expressShipping : 0;
  const tax = Math.round(taxableSubtotal * taxRate);

  return {
    subtotal,
    discount,
    shipping,
    tax,
    total: taxableSubtotal + shipping + tax,
  };
}
