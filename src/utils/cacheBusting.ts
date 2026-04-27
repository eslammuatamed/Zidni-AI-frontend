export function withCacheBusting(
  url: string | null | undefined,
  version?: string | number | null
): string {
  const trimmed = (url ?? '').trim();
  if (!trimmed) {
    return '';
  }
  const versionValue = (() => {
    if (version === null || version === undefined) {
      return String(Date.now());
    }
    const normalized = String(version).trim();
    return normalized.length ? normalized : String(Date.now());
  })();
  const separator = trimmed.includes('?') ? '&' : '?';
  return `${trimmed}${separator}v=${encodeURIComponent(versionValue)}`;
}
