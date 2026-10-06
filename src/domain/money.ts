import {ShopError} from './errors';

export const SHIPPING_RUPIAH = 15000;

export function assertSafeAmount(value: number, label = 'Nominal'): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new ShopError('validation', `${label} berada di luar batas yang didukung.`);
  }
  return value;
}

export function addRupiah(a: number, b: number): number {
  return assertSafeAmount(assertSafeAmount(a) + assertSafeAmount(b));
}

export function multiplyRupiah(price: number, quantity: number): number {
  return assertSafeAmount(assertSafeAmount(price) * assertSafeAmount(quantity));
}

/**
 * Formats an integer rupiah amount as `Rp1.234.567`. Implemented by hand so the
 * output does not depend on the JS engine's Intl data.
 */
export function formatRupiah(value: number): string {
  const amount = assertSafeAmount(value);
  return `Rp${String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}
