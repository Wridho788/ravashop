import {addRupiah, multiplyRupiah, SHIPPING_RUPIAH} from './money';
import {Totals} from './types';

export type PricedLine = {unitPriceRupiah: number; quantity: number};

export function lineTotal(line: PricedLine): number {
  return multiplyRupiah(line.unitPriceRupiah, line.quantity);
}

export function subtotalOf(lines: PricedLine[]): number {
  return lines.reduce((sum, line) => addRupiah(sum, lineTotal(line)), 0);
}

export function computeTotals(lines: PricedLine[]): Totals {
  const subtotalRupiah = subtotalOf(lines);
  return {
    subtotalRupiah,
    shippingRupiah: SHIPPING_RUPIAH,
    totalRupiah: addRupiah(subtotalRupiah, SHIPPING_RUPIAH),
  };
}
