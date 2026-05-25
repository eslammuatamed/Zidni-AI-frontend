export type DateLike = string | number | Date | null | undefined;

function toDate(value: DateLike): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTime(
  value: DateLike,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' },
  locale?: string
): string {
  const date = toDate(value);
  if (!date) {
    return '';
  }

  // `locale` defaults to undefined, which preserves the prior runtime-default
  // behaviour for every existing caller. Pass an explicit BCP-47 tag (e.g.
  // 'ar-u-nu-latn') to render in a specific locale with a chosen numbering system.
  const formatter = new Intl.DateTimeFormat(locale, options);
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

const FILE_SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < FILE_SIZE_UNITS.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const rounded = value >= 10 || unitIndex === 0 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded} ${FILE_SIZE_UNITS[unitIndex]}`;
}
