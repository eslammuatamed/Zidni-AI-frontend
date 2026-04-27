import { normalizeTenantSlug, sanitizeTenantSlug } from '@/utils/tenantStorage';

export interface HostClassification {
  host: string;
  normalizedHost: string;
  tenantSlug: string;
  isTenantHost: boolean;
  isDevTenantHost: boolean;
  isProdTenantHost: boolean;
  isGlobalAppHost: boolean;
}

const TENANT_DEV_SUFFIX = '.127.0.0.1.nip.io';
const TENANT_DEV_BASE_HOST = TENANT_DEV_SUFFIX.slice(1);
const TENANT_PROD_SUFFIX = '.zidni.cloud';
const TENANT_PROD_BASE_HOST = TENANT_PROD_SUFFIX.slice(1);

const startsWithReservedPrefix = (host: string) =>
  host.startsWith('app.') || host.startsWith('www.');

const resolveHostname = (candidate?: string): string => {
  if (candidate && candidate.trim().length > 0) {
    return candidate.trim();
  }
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return window.location.hostname.trim();
  }
  return '';
};

export const classifyHost = (hostname?: string): HostClassification => {
  const host = resolveHostname(hostname);
  const normalizedHost = host.toLowerCase();

  const isDevTenantHost =
    normalizedHost.endsWith(TENANT_DEV_SUFFIX) &&
    !startsWithReservedPrefix(normalizedHost) &&
    normalizedHost !== TENANT_DEV_BASE_HOST;
  const isProdTenantHost =
    normalizedHost.endsWith(TENANT_PROD_SUFFIX) &&
    !startsWithReservedPrefix(normalizedHost) &&
    normalizedHost !== TENANT_PROD_BASE_HOST;
  const isTenantHost = isDevTenantHost || isProdTenantHost;

  let tenantSlug = '';
  if (isTenantHost) {
    const segments = normalizedHost.split('.').filter(Boolean);
    const [rawSlug] = segments;
    tenantSlug = normalizeTenantSlug(rawSlug);
  }

  const isGlobalAppHost =
    normalizedHost === `app${TENANT_DEV_SUFFIX}` ||
    normalizedHost.startsWith('app.') ||
    normalizedHost.startsWith('www.');

  return {
    host,
    normalizedHost,
    tenantSlug: sanitizeTenantSlug(tenantSlug),
    isTenantHost,
    isDevTenantHost,
    isProdTenantHost,
    isGlobalAppHost
  };
};

export const isTenantHost = (hostname?: string) => classifyHost(hostname).isTenantHost;

export const isGlobalAppHost = (hostname?: string) => classifyHost(hostname).isGlobalAppHost;

