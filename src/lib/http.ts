// frontend/spa/src/lib/http.ts
import axios, {
  AxiosHeaders,
  type AxiosRequestConfig
} from 'axios';
import { extractTenant, isAppHost } from '@/lib/host';
import {
  extractSessionMessage,
  isSessionRedirecting,
  matchesSessionKeyword,
  shouldHandleSession,
  triggerSessionRedirect
} from '@/lib/sessionExpiry';

type UseAuthStore = typeof import('@/stores/auth')['useAuthStore'];
type AuthStore = ReturnType<UseAuthStore> | null;

let cachedAuthStore: AuthStore = null;

const resolveAuthStore = async (): Promise<AuthStore> => {
  if (cachedAuthStore) {
    return cachedAuthStore;
  }
  try {
    const module = await import('@/stores/auth');
    cachedAuthStore = module.useAuthStore();
    return cachedAuthStore;
  } catch (error) {
    console.warn('[http] unable to resolve auth store for session redirect', error);
    return null;
  }
};

const AUTH_ENDPOINT_PATTERN = /\/v1\/auth\/(?:login|platform\/login|refresh|logout)/i;

const isAuthFlowRequest = (configUrl: unknown): boolean => {
  if (typeof configUrl !== 'string') {
    return false;
  }
  return AUTH_ENDPOINT_PATTERN.test(configUrl);
};

const maybeTriggerSessionRedirect = async (
  status: number,
  message: string,
  configUrl: unknown
): Promise<void> => {
  if (isSessionRedirecting() || isAuthFlowRequest(configUrl) || !shouldHandleSession(status, message)) {
    return;
  }

  const authStore = await resolveAuthStore();
  const roleHint = authStore?.role ?? null;
  const tenantHint = (authStore?.user?.tenant?.slug ?? null) as string | null;
  const hadSession = Boolean(authStore?.isAuthenticated || authStore?.user);

  if (!hadSession && status === 401 && !matchesSessionKeyword(message)) {
    return;
  }

  try {
    authStore?.clearAuthState();
  } catch (error) {
    console.warn('[http] unable to clear auth state after session expiration', error);
  }

  triggerSessionRedirect({ roleHint, tenantHint, hadSession });
};

/**
 * -----------------------------------------------------------------------------
 * Base URL resolution
 * -----------------------------------------------------------------------------
 */
const DEFAULT_API_BASE = '/api';

const isAbsoluteUrl = (value: string): boolean =>
  /^[a-z][a-z\d+\-.]*:\/\//i.test(value);

const sanitizeAbsolute = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/+$/, '') || null;
};

const sanitizePath = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withoutTrailing = trimmed.replace(/\/+$/, '');
  if (!withoutTrailing) return null;
  if (withoutTrailing === '/') return '/';
  return withoutTrailing.startsWith('/') ? withoutTrailing : `/${withoutTrailing}`;
};

const shouldPreferTenantOrigin = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    if (isAppHost()) {
      return false;
    }
    const tenant = extractTenant();
    return typeof tenant === 'string' && tenant.length > 0;
  } catch {
    return false;
  }
};

type TenantApiBase = { value: string; relative: boolean };

const resolveTenantApiBase = (): TenantApiBase | null => {
  const tenantAbsolute = sanitizeAbsolute(import.meta.env.VITE_TENANT_API_BASE_URL);
  if (tenantAbsolute && isAbsoluteUrl(tenantAbsolute)) {
    return { value: tenantAbsolute, relative: false };
  }

  const tenantBase = sanitizePath(import.meta.env.VITE_TENANT_API_BASE);
  if (tenantBase) {
    return { value: tenantBase, relative: true };
  }

  return null;
};

const allowRelativeTenantApiBase = (() => {
  const raw = (import.meta.env.VITE_TENANT_API_ALLOW_RELATIVE || '').toString().trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes';
})();

const computeBaseUrl = (): string => {
  const preferTenantOrigin = shouldPreferTenantOrigin();
  const tenantBase = resolveTenantApiBase();
  const usableTenantBase = tenantBase && (!tenantBase.relative || allowRelativeTenantApiBase)
    ? tenantBase.value
    : null;

  if (preferTenantOrigin) {
    if (usableTenantBase) {
      return usableTenantBase;
    }

    // When we're on a tenant-hosted domain but no specific base URL is provided,
    // prefer staying on the same origin instead of bouncing back to the app
    // domain. This keeps cookies scoped to the tenant host (and therefore
    // available for /v1/auth/me, /v1/auth/refresh, etc.). Falling back to the
    // absolute API_BASE_URL here breaks student sessions because the auth
    // cookies get written for the tenant domain but the requests are sent to the
    // app domain, causing consistent 401/403 responses during login.
    return DEFAULT_API_BASE;
  }

  const direct = sanitizeAbsolute(import.meta.env.VITE_API_BASE_URL);
  if (direct) return direct;
  const directPath = sanitizePath(import.meta.env.VITE_API_BASE_URL);
  if (directPath) return directPath;

  const legacyUrl = sanitizeAbsolute(import.meta.env.VITE_API_URL);
  const legacyBase = sanitizePath(import.meta.env.VITE_API_BASE);

  if (legacyUrl && legacyBase) return `${legacyUrl}${legacyBase}`;
  if (legacyUrl) return legacyUrl;
  if (legacyBase) return legacyBase;

  if (usableTenantBase) {
    return usableTenantBase;
  }

  return DEFAULT_API_BASE;
};

// strip trailing slashes but keep "/" if that's all we have
const resolvedBaseUrl = (() => {
  const c = computeBaseUrl();
  const normalized = c.replace(/\/+$/, '');
  return normalized || DEFAULT_API_BASE;
})();

/**
 * -----------------------------------------------------------------------------
 * Same-origin client header policy
 * -----------------------------------------------------------------------------
 */
const defaultClientHeaderPolicy = (() => {
  if (typeof window === 'undefined' || !window.location) {
    return !isAbsoluteUrl(resolvedBaseUrl);
  }
  try {
    const target = new URL(resolvedBaseUrl, window.location.origin);
    return target.origin === window.location.origin;
  } catch {
    return !isAbsoluteUrl(resolvedBaseUrl);
  }
})();

type MaybeConfigUrl = Pick<AxiosRequestConfig, 'baseURL' | 'url'>;

const resolveRequestOrigin = (config: MaybeConfigUrl): string | null => {
  const candidateUrl = typeof config.url === 'string' ? config.url : '';
  const base = typeof config.baseURL === 'string' ? config.baseURL.trim() : '';

  try {
    if (candidateUrl && isAbsoluteUrl(candidateUrl)) {
      return new URL(candidateUrl).origin;
    }

    if (base && isAbsoluteUrl(base)) {
      return new URL(candidateUrl || '.', base).origin;
    }

    if (typeof window !== 'undefined' && window.location) {
      const anchorBase = base || resolvedBaseUrl;
      const resolved = isAbsoluteUrl(anchorBase)
        ? anchorBase
        : new URL(anchorBase || '.', window.location.origin).toString();
      return new URL(candidateUrl || '.', resolved).origin;
    }
  } catch (error) {
    console.warn('[http] unable to resolve request origin', error);
  }

  return null;
};

const shouldAttachClientHeader = (config: MaybeConfigUrl): boolean => {
  const origin = resolveRequestOrigin(config);
  if (!origin) return defaultClientHeaderPolicy;

  if (typeof window === 'undefined' || !window.location) {
    return origin === '';
  }
  return origin === window.location.origin;
};

/**
 * -----------------------------------------------------------------------------
 * Base-path merge (when app is served under a sub-path)
 * -----------------------------------------------------------------------------
 */
const escapedRegexFragment = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const basePathForMerge = (() => {
  // remove origin if present
  const withoutOrigin = resolvedBaseUrl.replace(/^[a-z][a-z\d+\-.]*:\/\/[^/]+/i, '');
  const withoutQuery = withoutOrigin.split(/[?#]/)[0] ?? '';
  const normalized = withoutQuery.replace(/\/+$/, '');
  return normalized && normalized !== '/' ? normalized : null;
})();

const basePathStripRegex = basePathForMerge
  ? new RegExp(`^${escapedRegexFragment(basePathForMerge)}(?=/|$|[?#])`)
  : null;

/**
 * -----------------------------------------------------------------------------
 * Axios instance
 * -----------------------------------------------------------------------------
 */
export const http = axios.create({
  baseURL: resolvedBaseUrl,
  withCredentials: true,
  timeout: 20_000,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN'
});

/**
 * -----------------------------------------------------------------------------
 * CSRF bootstrap helpers
 * -----------------------------------------------------------------------------
 */
const readCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const prefix = `${name}=`;
  for (const seg of document.cookie.split(';')) {
    const t = seg.trim();
    if (t.startsWith(prefix)) return decodeURIComponent(t.substring(prefix.length));
  }
  return null;
};

let xsrfBootstrapping: Promise<void> | null = null;

const resolveXsrfBootstrapUrl = (): string => {
  const trimmedBase = resolvedBaseUrl.replace(/\/+$/, '');

  const stripApiTail = (value: string): string => value.replace(/\/api(?:\/.*)?$/i, '');
  const buildCsrfPath = (basePath: string): string => {
    const normalized = basePath.replace(/\/+$/, '');
    const combined = `${normalized ? normalized : ''}/api/csrf/ready`;
    return combined.startsWith('/') ? combined : `/${combined}`;
  };

  const buildAbsolute = (): URL | null => {
    try {
      return new URL(trimmedBase);
    } catch {
      if (typeof window !== 'undefined' && window.location) {
        try {
          return new URL(trimmedBase || '.', window.location.origin);
        } catch {
          return null;
        }
      }
      return null;
    }
  };

  const absolute = buildAbsolute();
  if (absolute) {
    const cleanedPath = stripApiTail(absolute.pathname.replace(/\/+$/, ''));
    const nextPath = buildCsrfPath(cleanedPath);
    absolute.pathname = nextPath;
    absolute.search = '';
    absolute.hash = '';
    if (typeof window !== 'undefined' && absolute.origin === window.location.origin) {
      return absolute.pathname;
    }
    return absolute.toString();
  }

  const relativeBase = stripApiTail(trimmedBase);
  const prefix = relativeBase ? relativeBase.replace(/\/+$/, '') : '';
  const path = buildCsrfPath(prefix);
  return path.startsWith('/') ? path : `/${path}`;
};

const ensureXsrf = (): Promise<void> => {
  if (readCookie('XSRF-TOKEN')) return Promise.resolve();
  if (xsrfBootstrapping) return xsrfBootstrapping;

  // Use raw axios to bypass interceptors
  xsrfBootstrapping = axios
    .get(resolveXsrfBootstrapUrl(), { withCredentials: true })
    .catch(() => {})
    .then(() => {
      xsrfBootstrapping = null;
    });

  return xsrfBootstrapping!;
};

/**
 * -----------------------------------------------------------------------------
 * Request interceptor
 * -----------------------------------------------------------------------------
 */
http.interceptors.request.use(
  async (config) => {
    // Determine if method requires XSRF
    const method = (config.method || 'get').toLowerCase();
    const needsXsrf =
      method === 'post' || method === 'put' || method === 'patch' || method === 'delete';

    // Bootstrap XSRF cookie if needed
    if (needsXsrf && !readCookie('XSRF-TOKEN')) {
      await ensureXsrf();
    }

    // Normalize/clean URL
    if (typeof config.url === 'string') {
      const original = config.url;
      let u = original;

      // keep specific legacy paths (server expects without /api prefix)
      const legacyKeep = [
        /^\/api\/teacher\/subscriptions\/current(?:\/|$)/,
        /^\/api\/teacher\/subscriptions\/history(?:\/|$)/,
        /^\/api\/teacher\/reports\/overview(?:\/|$)/
      ];
      if (legacyKeep.some((re) => re.test(u))) {
        u = u.replace(/^\/api\//, '/');
        if (import.meta.env.DEV && u !== original) {
          console.debug('[api] keep-legacy', { from: original, to: u });
        }
        config.url = u;
      } else {
        // collapse accidental /api/api
        if (/^\/api\/api(\/|$)/.test(u)) {
          u = u.replace(/^\/api\/api(\/|$)/, '/api$1');
        }

        // if using /api/v1/... with baseURL already /api, drop the extra /api
        if (/^\/api\/v1\//.test(u)) {
          u = u.replace(/^\/api(?=\/v1\/)/, '');
        }

        // merge out deployed base path if any
        if (basePathStripRegex && !/^[a-z][a-z\d+\-.]*:\/\//i.test(u)) {
          const withLeading = u.startsWith('/') ? u : `/${u}`;
          const replaced = withLeading.replace(basePathStripRegex, '');
          if (replaced !== withLeading) {
            let normalized = replaced || '/';
            if (normalized.startsWith('?') || normalized.startsWith('#')) {
              normalized = `/${normalized}`;
            } else if (!normalized.startsWith('/')) {
              normalized = `/${normalized}`;
            }
            u = normalized;
          } else {
            u = withLeading;
          }
        }

        if (import.meta.env.DEV && u !== original) {
          console.debug('[api] normalized', { from: original, to: u });
        }
        config.url = u;
      }
    }

    // Always convert headers to AxiosHeaders for consistent API
    config.headers = AxiosHeaders.from(config.headers as any);

    const allowClientHeader = shouldAttachClientHeader(config);
    const h = config.headers as unknown as InstanceType<typeof AxiosHeaders>;

    // Manage X-Client header only for same-origin modifying requests
    if (allowClientHeader && (needsXsrf || method === 'get')) {
      h.set('X-Client', 'web');
    } else {
      h.delete('X-Client');
    }

    // Ensure XSRF header mirrors cookie when needed
    if (needsXsrf) {
      const csrf = readCookie('XSRF-TOKEN');
      if (csrf) h.set('X-XSRF-TOKEN', csrf);
      else h.delete('X-XSRF-TOKEN');
    }

    return config;
  }
);

/**
 * -----------------------------------------------------------------------------
 * Refresh flow and response interceptor
 * -----------------------------------------------------------------------------
 */
let refreshing = false;
let refreshWaiters: Array<() => void> = [];

const enqueueRefresh = (): Promise<void> =>
  new Promise((resolve) => {
    refreshWaiters.push(resolve);
  });

const flushRefreshQueue = (): void => {
  refreshWaiters.forEach((resolve) => resolve());
  refreshWaiters = [];
};

const refreshSession = async (): Promise<void> => {
  // Ensure XSRF before POST /v1/auth/refresh
  await ensureXsrf();

  const refreshUrl = `${resolvedBaseUrl}/v1/auth/refresh`;
  const csrfToken = readCookie('XSRF-TOKEN');

  const headers = AxiosHeaders.from({});
  if (shouldAttachClientHeader({ baseURL: resolvedBaseUrl, url: refreshUrl })) {
    headers.set('X-Client', 'web');
  }
  if (csrfToken) headers.set('X-XSRF-TOKEN', csrfToken);

  await axios.post(refreshUrl, {}, { withCredentials: true, headers });
};

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error || {};
    if (!response || !config) throw error;

    type RetryConfig = typeof config & { __retry?: boolean };
    const retryConfig = config as RetryConfig;

    if ((response.status === 401 || response.status === 419) && !retryConfig.__retry) {
      retryConfig.__retry = true;

      if (!refreshing) {
        refreshing = true;
        try {
          await refreshSession();
        } catch {
          refreshing = false;
          flushRefreshQueue();
          const sessionMessage = extractSessionMessage(response.data, response.statusText);
          await maybeTriggerSessionRedirect(response.status, sessionMessage, config.url);
          throw error;
        }
        refreshing = false;
        flushRefreshQueue();
      } else {
        await enqueueRefresh();
      }

      return http(retryConfig);
    }

    const sessionMessage = extractSessionMessage(response.data, response.statusText);
    await maybeTriggerSessionRedirect(response.status, sessionMessage, config.url ?? retryConfig.baseURL);

    throw error;
  }
);

export default http;
