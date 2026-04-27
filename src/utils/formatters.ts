export type DateLike = string | number | Date | null | undefined;

function toDate(value: DateLike): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTime(
  value: DateLike,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' }
): string {
  const date = toDate(value);
  if (!date) {
    return '';
  }

  const formatter = new Intl.DateTimeFormat(undefined, options);
  return formatter.format(date);
}

export function formatRelativeTimeToNow(value: DateLike): string {
  const date = toDate(value);
  if (!date) {
    return '';
  }

  const now = Date.now();
  let deltaSeconds = Math.round((date.getTime() - now) / 1000);

  const divisions: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
    { amount: 60, unit: 'second' },
    { amount: 60, unit: 'minute' },
    { amount: 24, unit: 'hour' },
    { amount: 7, unit: 'day' },
    { amount: 4.34524, unit: 'week' },
    { amount: 12, unit: 'month' },
    { amount: Number.POSITIVE_INFINITY, unit: 'year' }
  ];

  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

  for (const division of divisions) {
    if (Math.abs(deltaSeconds) < division.amount) {
      return rtf.format(deltaSeconds, division.unit);
    }
    deltaSeconds = Math.round(deltaSeconds / division.amount);
  }

  return '';
}
