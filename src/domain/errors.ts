export type ShopErrorKind = 'validation' | 'stock' | 'storage' | 'migration' | 'not_found';

export type FieldErrors = Partial<Record<string, string>>;

/** Structured error returned by every repository operation. */
export class ShopError extends Error {
  readonly kind: ShopErrorKind;
  readonly fieldErrors?: FieldErrors;

  constructor(kind: ShopErrorKind, message: string, fieldErrors?: FieldErrors) {
    super(message);
    this.name = 'ShopError';
    this.kind = kind;
    this.fieldErrors = fieldErrors;
  }
}

export const isShopError = (error: unknown): error is ShopError => error instanceof ShopError;

export function errorMessage(error: unknown): string {
  if (isShopError(error)) {
    return error.message;
  }
  return 'Terjadi kesalahan. Silakan coba lagi.';
}
