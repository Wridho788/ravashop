import {formatDateTime, formatOrderNumber} from '../src/shared/format';

describe('format', () => {
  it('formats order numbers with a fixed width', () => {
    expect(formatOrderNumber(1)).toBe('RS-0001');
    expect(formatOrderNumber(12345)).toBe('RS-12345');
  });

  it('formats local date and time in Indonesian', () => {
    const date = new Date(2026, 9, 5, 14, 7);
    expect(formatDateTime(date.toISOString())).toBe('5 Okt 2026, 14.07');
  });

  it('returns a dash for invalid dates', () => {
    expect(formatDateTime('bukan tanggal')).toBe('-');
  });
});
