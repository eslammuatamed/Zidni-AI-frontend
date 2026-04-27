export function safeRedirect(raw: unknown, fallback: string): string {
  let target = typeof raw === 'string' ? raw : '';
  try {
    target = decodeURIComponent(target);
  } catch {
    // ignore decode errors
  }
  const external = /^https?:\/\//i.test(target) || target.startsWith('//');
  if (!target || external || target.includes('/login')) {
    return fallback;
  }
  if (!target.startsWith('/')) {
    target = `/${target}`;
  }
  return target;
}
