const sanitize = (value?: string | null): string => (value ?? '').trim().toLowerCase();

const tenantPattern = /^[a-z0-9-]+$/;

const baseHost = sanitize(import.meta.env.VITE_PLATFORM_BASE_HOST);
const appSubdomain = sanitize(import.meta.env.VITE_APP_SUBDOMAIN);

export const inferTenantFromHost = (host: string): string | null => {
  if (!host) {
    return null;
  }

  const normalizedHost = host.trim().toLowerCase();
  const [hostname] = normalizedHost.split(':');

  if (!baseHost || !hostname.endsWith(baseHost)) {
    return null;
  }

  const withoutBase = hostname.slice(0, hostname.length - baseHost.length).replace(/\.$/, '');
  if (!withoutBase) {
    return null;
  }

  const segments = withoutBase.split('.').filter(Boolean);
  if (!segments.length) {
    return null;
  }

  const lastSegment = segments[segments.length - 1];
  if (appSubdomain && lastSegment === appSubdomain) {
    segments.pop();
  }

  const tenantCandidate = segments[segments.length - 1];
  if (!tenantCandidate || !tenantPattern.test(tenantCandidate)) {
    return null;
  }

  return tenantCandidate;
};

export const validateTenantParam = (routeParam: string, meTenantSlug?: string | null): boolean => {
  const slug = sanitize(routeParam);
  if (!slug || !tenantPattern.test(slug)) {
    return false;
  }

  if (meTenantSlug) {
    return slug === sanitize(meTenantSlug);
  }

  return true;
};

export default {
  inferTenantFromHost,
  validateTenantParam
};
