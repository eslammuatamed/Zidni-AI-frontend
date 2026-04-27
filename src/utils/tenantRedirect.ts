const DEFAULT_DEV_DOMAIN = '127.0.0.1.nip.io';

const sanitizeDomain = (value: string) => value.trim().replace(/^\.+|\.+$/g, '');

const getDevBaseDomain = () =>
  sanitizeDomain(import.meta.env.VITE_DEV_DOMAIN_BASE ?? DEFAULT_DEV_DOMAIN) || DEFAULT_DEV_DOMAIN;

const ensureLeadingSlash = (path: string) => {
  if (!path) {
    return '/';
  }
  return path.startsWith('/') ? path : `/${path}`;
};

const getNormalizedSlug = (tenantSlug: string) => tenantSlug.trim().toLowerCase();

export const isOnTenantHost = (tenantSlug: string): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  const slug = getNormalizedSlug(tenantSlug);
  if (!slug) {
    return false;
  }
  const currentHost = window.location.hostname.toLowerCase();
  if (import.meta.env.PROD) {
    return currentHost === `${slug}.zidni.cloud`;
  }
  const base = getDevBaseDomain().toLowerCase();
  return currentHost === `${slug}.${base}`;
};

export const redirectToTenantSubdomain = (tenantSlug: string, path: string): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  const slug = getNormalizedSlug(tenantSlug);
  if (!slug) {
    return false;
  }
  const targetPath = ensureLeadingSlash(path);
  const currentHost = window.location.hostname.toLowerCase();

  if (import.meta.env.PROD) {
    const targetHost = `${slug}.zidni.cloud`;
    if (currentHost === targetHost) {
      return false;
    }
    window.location.href = `https://${targetHost}${targetPath}`;
    return true;
  }

  const base = getDevBaseDomain().toLowerCase();
  const targetHost = `${slug}.${base}`;
  if (currentHost === targetHost) {
    return false;
  }
  window.location.href = `http://${targetHost}:5173${targetPath}`;
  return true;
};

export const getTenantSubdomainUrl = (tenantSlug: string, path: string): string | null => {
  const slug = getNormalizedSlug(tenantSlug);
  if (!slug) {
    return null;
  }

  const targetPath = ensureLeadingSlash(path);

  if (import.meta.env.PROD) {
    return `https://${slug}.zidni.cloud${targetPath}`;
  }

  const base = getDevBaseDomain().toLowerCase();
  return `http://${slug}.${base}:5173${targetPath}`;
};
