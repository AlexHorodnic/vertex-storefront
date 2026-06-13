import { CheckoutStep } from '../checkout.models';

const shippingControls = [
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

const paymentControls = ['cardholderName', 'cardNumber', 'expiry', 'cvc'] as const;

export function canVisitCheckoutStep(
  step: CheckoutStep,
  isControlValid: (controlName: string) => boolean,
): boolean {
  if (step === 'cart' || step === 'shipping') {
    return true;
  }

  const requiredControls =
    step === 'payment' ? shippingControls : [...shippingControls, ...paymentControls];

  return requiredControls.every(isControlValid);
}
