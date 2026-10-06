import {ShopError} from '../src/domain/errors';
import {addRupiah, formatRupiah, multiplyRupiah, SHIPPING_RUPIAH} from '../src/domain/money';
import {computeTotals} from '../src/domain/totals';
import {normalizeAddress, validateAddress, validateQuantity} from '../src/domain/validation';

const validAddress = {
  recipient: 'Pengguna Demo',
  phone: '081234567890',
  addressText: 'Jalan Contoh 10, Kota Demo',
};

describe('money', () => {
  it('formats integer rupiah with dot separators', () => {
    expect(formatRupiah(0)).toBe('Rp0');
    expect(formatRupiah(15000)).toBe('Rp15.000');
    expect(formatRupiah(615000)).toBe('Rp615.000');
    expect(formatRupiah(1234567890)).toBe('Rp1.234.567.890');
  });

  it('rejects amounts outside the safe integer range', () => {
    expect(() => formatRupiah(1.5)).toThrow(ShopError);
    expect(() => addRupiah(Number.MAX_SAFE_INTEGER, 1)).toThrow(ShopError);
    expect(() => multiplyRupiah(Number.MAX_SAFE_INTEGER, 2)).toThrow(ShopError);
    expect(() => multiplyRupiah(-1, 2)).toThrow(ShopError);
  });
});

describe('totals', () => {
  it('computes the shop-v1 reference checkout: two bags and one bottle', () => {
    const totals = computeTotals([
      {unitPriceRupiah: 250000, quantity: 2},
      {unitPriceRupiah: 100000, quantity: 1},
    ]);
    expect(totals).toEqual({subtotalRupiah: 600000, shippingRupiah: SHIPPING_RUPIAH, totalRupiah: 615000});
  });
});

describe('address validation', () => {
  it('accepts the fictitious test address', () => {
    expect(validateAddress(validAddress)).toEqual({});
  });

  it('reports every missing field', () => {
    const errors = validateAddress({recipient: '  ', phone: '', addressText: ''});
    expect(Object.keys(errors).sort()).toEqual(['addressText', 'phone', 'recipient']);
  });

  it('enforces length and phone digit rules', () => {
    expect(validateAddress({...validAddress, recipient: 'A'}).recipient).toBeDefined();
    expect(validateAddress({...validAddress, recipient: 'A'.repeat(81)}).recipient).toBeDefined();
    expect(validateAddress({...validAddress, addressText: 'Pendek'}).addressText).toBeDefined();
    expect(validateAddress({...validAddress, addressText: 'x'.repeat(301)}).addressText).toBeDefined();
    expect(validateAddress({...validAddress, phone: '1234567'}).phone).toBeDefined();
    expect(validateAddress({...validAddress, phone: '1234567890123456'}).phone).toBeDefined();
    expect(validateAddress({...validAddress, phone: '0812abc'}).phone).toBeDefined();
    expect(validateAddress({...validAddress, phone: '+62 812-3456-7890'})).toEqual({});
  });

  it('trims and collapses whitespace', () => {
    expect(
      normalizeAddress({recipient: '  Pengguna   Demo ', phone: ' 0812 ', addressText: ' Jalan  10 '}),
    ).toEqual({
      recipient: 'Pengguna Demo',
      phone: '0812',
      addressText: 'Jalan  10',
    });
  });
});

describe('quantity validation', () => {
  it.each([0, -1, 1.5, Number.NaN])('rejects %p', quantity => {
    expect(() => validateQuantity(quantity, 3)).toThrow(expect.objectContaining({kind: 'validation'}));
  });

  it('rejects quantities above stock and sold-out items', () => {
    expect(() => validateQuantity(4, 3)).toThrow(expect.objectContaining({kind: 'stock'}));
    expect(() => validateQuantity(1, 0)).toThrow(expect.objectContaining({kind: 'stock'}));
  });

  it('accepts 1 up to stock', () => {
    expect(() => validateQuantity(1, 3)).not.toThrow();
    expect(() => validateQuantity(3, 3)).not.toThrow();
  });
});
