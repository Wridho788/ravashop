import {FieldErrors, ShopError} from './errors';
import {AddressInput} from './types';

export const RECIPIENT_MIN = 2;
export const RECIPIENT_MAX = 80;
export const ADDRESS_MIN = 10;
export const ADDRESS_MAX = 300;
export const PHONE_DIGITS_MIN = 8;
export const PHONE_DIGITS_MAX = 15;

const collapse = (value: string) => value.trim().replace(/\s+/g, ' ');

export function normalizeAddress(input: AddressInput): AddressInput {
  return {
    recipient: collapse(input.recipient),
    phone: collapse(input.phone),
    addressText: input.addressText.trim(),
  };
}

export function validateAddress(input: AddressInput): FieldErrors {
  const value = normalizeAddress(input);
  const errors: FieldErrors = {};

  if (!value.recipient) {
    errors.recipient = 'Nama penerima wajib diisi.';
  } else if (value.recipient.length < RECIPIENT_MIN || value.recipient.length > RECIPIENT_MAX) {
    errors.recipient = `Nama penerima ${RECIPIENT_MIN}–${RECIPIENT_MAX} karakter.`;
  }

  const digits = value.phone.replace(/\D/g, '');
  if (!value.phone) {
    errors.phone = 'Nomor kontak wajib diisi.';
  } else if (!/^[0-9+\- ]+$/.test(value.phone)) {
    errors.phone = 'Nomor kontak hanya boleh berisi angka, spasi, +, dan -.';
  } else if (digits.length < PHONE_DIGITS_MIN || digits.length > PHONE_DIGITS_MAX) {
    errors.phone = `Nomor kontak harus ${PHONE_DIGITS_MIN}–${PHONE_DIGITS_MAX} digit.`;
  }

  if (!value.addressText) {
    errors.addressText = 'Alamat lengkap wajib diisi.';
  } else if (value.addressText.length < ADDRESS_MIN || value.addressText.length > ADDRESS_MAX) {
    errors.addressText = `Alamat lengkap ${ADDRESS_MIN}–${ADDRESS_MAX} karakter.`;
  }

  return errors;
}

/** Returns the normalized address or throws a validation error with per-field messages. */
export function requireValidAddress(input: AddressInput): AddressInput {
  const errors = validateAddress(input);
  if (Object.keys(errors).length > 0) {
    throw new ShopError('validation', 'Periksa kembali data alamat.', errors);
  }
  return normalizeAddress(input);
}

/** Quantity must be a whole number between 1 and the available stock. */
export function validateQuantity(quantity: number, stock: number): void {
  if (!Number.isSafeInteger(quantity) || quantity < 1) {
    throw new ShopError('validation', 'Jumlah harus bilangan bulat minimal 1.');
  }
  if (quantity > stock) {
    throw new ShopError('stock', stock === 0 ? 'Stok produk habis.' : `Stok tidak cukup. Maksimal ${stock}.`);
  }
}
