const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const pad = (value: number) => String(value).padStart(2, '0');

/** `5 Okt 2026, 14.30` in device local time; hand-rolled so it does not depend on Intl data. */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}, ${pad(date.getHours())}.${pad(
    date.getMinutes(),
  )}`;
}

export const formatOrderNumber = (number: number) => `RS-${String(number).padStart(4, '0')}`;
