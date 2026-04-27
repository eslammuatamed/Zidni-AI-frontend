export function isPreviewEnabled(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(isPreviewEnabled);
  }

  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return false;
    }
    return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
  }

  return false;
}
