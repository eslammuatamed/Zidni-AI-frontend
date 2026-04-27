const DEFAULT_APP_SUBDOMAIN = 'app';

const TENANT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const sanitizeHost = (value: string | null | undefined): string => {
  if (!value) {
    return '';
  }
  return value.split(':')[0] ?? '';
};

const getCurrentHost = (): string => {
  if (typeof location === 'undefined') {
    return '';
  }
  return sanitizeHost(location.host);
};

const resolveProtocol = (): string => {
  if (typeof location === 'undefined') {
    return 'https:';
  }
  return location.protocol || 'https:';
};

const resolvePort = (host: string): string => {
  if (typeof location === 'undefined') {
    return '';
  }
  if (host.includes(':')) {
    return '';
  }
  const port = location.port;
  if (!port) {
    return '';
  }
  return `:${port}`;
};

const deriveBaseHostFromLocation = (): string => {
  const host = getCurrentHost();
  if (!host) {
    return '';
  }
  const appPrefix = `${DEFAULT_APP_SUBDOMAIN}.`;
  if (host.startsWith(appPrefix)) {
    const remainder = host.slice(appPrefix.length);
    return remainder || host;
  }
  return host;
};

const swapSubdomain = (nextSub: string, fallbackTenant?: string): string => {
  const base = getBaseHost();
  const cleanedNext = nextSub.trim();
  if (base) {
    return cleanedNext ? `${cleanedNext}.${base}` : base;
  }
  const host = getCurrentHost();
  if (!host) {
    return cleanedNext || fallbackTenant || '';
  }
  const parts = host.split('.');
  if (parts.length <= 1) {
    return host;
  }
  parts[0] = cleanedNext || parts[0];
  return parts.join('.');
};

const normalizePath = (path: string): string => {
  if (!path) {
    return '/';
  }
  return path.startsWith('/') ? path : `/${path}`;
};

const redirectToTenantPicker = (): null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const target = buildAppUrl('/student/choose-tenant');
  if (window.location.href !== target) {
    window.location.replace(target);
  }
  return null;
};

const normalizeTenantSlug = (value: string | null | undefined): string => {
  if (typeof value !== 'string') {
    return '';
  }
  const candidate = value.trim().toLowerCase();
  if (!candidate) {
    return '';
  }
  return TENANT_SLUG_PATTERN.test(candidate) ? candidate : '';
};

export function getBaseHost(): string {
  const envValue = (import.meta.env.VITE_BASE_HOST || '').trim();
  if (envValue && envValue !== 'undefined') {
    return envValue;
  }
  const derived = deriveBaseHostFromLocation();
  return derived && derived !== 'undefined' ? derived : '';
}

export function getAppSub(): string {
  const envValue = (import.meta.env.VITE_APP_SUBDOMAIN || '').trim();
  if (envValue) {
    return envValue;
  }
  return DEFAULT_APP_SUBDOMAIN;
}

export function isAppHost(host = typeof location !== 'undefined' ? location.host : ''): boolean {
  const sanitized = sanitizeHost(host);
  if (!sanitized) {
    return false;
  }
  const expected = swapSubdomain(getAppSub());
  return sanitizeHost(expected) === sanitized;
}

export function extractTenant(host = typeof location !== 'undefined' ? location.host : ''): string | null {
  const sanitized = sanitizeHost(host);
  if (!sanitized) {
    return null;
  }
  const base = getBaseHost();
  if (base) {
    if (!sanitized.endsWith(`.${base}`)) {
      return null;
    }
    const prefix = sanitized.slice(0, sanitized.length - (base.length + 1));
    const tenant = prefix.trim();
    if (!tenant || tenant === getAppSub()) {
      return null;
    }
    if (tenant.includes('.')) {
      return redirectToTenantPicker();
    }
    const normalized = normalizeTenantSlug(tenant);
    if (!normalized) {
      return redirectToTenantPicker();
    }
    return normalized;
  }
  const parts = sanitized.split('.');
  if (parts.length <= 1) {
    return null;
  }
  if (parts.length > 2) {
    return redirectToTenantPicker();
  }
  const tenant = parts[0];
  if (!tenant || tenant === getAppSub()) {
    return null;
  }
  const normalized = normalizeTenantSlug(tenant);
  if (!normalized) {
    return redirectToTenantPicker();
  }
  return normalized;
}

export function buildAppUrl(path: string): string {
  const desiredHost = swapSubdomain(getAppSub());
  const host = desiredHost || getCurrentHost() || getBaseHost() || getAppSub();
  const port = resolvePort(desiredHost || host);
  return `${resolveProtocol()}//${host}${port}${normalizePath(path)}`;
}

export function buildTenantUrl(tenant: string, path: string): string {
  const requested = normalizeTenantSlug(tenant);
  const fallback = normalizeTenantSlug(extractTenant() || '');
  const slug = requested || fallback;
  if (!slug) {
    return buildAppUrl(path);
  }
  const desiredHost = swapSubdomain(slug, slug);
  const host = desiredHost || getCurrentHost() || getBaseHost();
  const port = resolvePort(desiredHost || host);
  return `${resolveProtocol()}//${host}${port}${normalizePath(path)}`;
}
