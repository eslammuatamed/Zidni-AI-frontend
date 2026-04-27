export function getTenantFromHost(host: string): string | null {
  const withoutPort = host.split(':')[0] ?? '';
  const parts = withoutPort.split('.').filter(Boolean);
  if (parts.length === 0) {
    return null;
  }
  const sub = parts[0];
  if (!sub || sub === 'app' || /^\d+$/.test(sub)) {
    return null;
  }
  return sub;
}

export function isPlatformHost(host: string): boolean {
  return !getTenantFromHost(host);
}

function resolveBaseHost(host: string): string {
  const [hostname, port] = host.split(':');
  if (!hostname) {
    return host;
  }
  const parts = hostname.split('.');
  if (parts.length <= 1) {
    return host;
  }
  const [first, ...rest] = parts;
  if (first === 'app') {
    const base = rest.join('.');
    return port ? `${base}:${port}` : base;
  }
  if (/^\d+$/.test(first)) {
    return host;
  }
  const baseHost = rest.join('.');
  return port ? `${baseHost}:${port}` : baseHost;
}

export function tenantUrl(tenantSlug: string, path = '/'): string {
  const targetPath = path.startsWith('/') ? path : `/${path}`;
  const host = window.location.host;
  const proto = window.location.protocol;
  const currentTenant = getTenantFromHost(host);
  if (!currentTenant) {
    const base = resolveBaseHost(host);
    return `${proto}//${tenantSlug}.${base}${targetPath}`;
  }
  const [hostname, port] = host.split(':');
  const [, ...rest] = (hostname ?? '').split('.');
  const baseHost = rest.join('.');
  const base = port ? `${baseHost}:${port}` : baseHost;
  return `${proto}//${tenantSlug}.${base}${targetPath}`;
}
