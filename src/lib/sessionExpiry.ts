import { useToast } from '@/composables/useToast';
import i18n from '@/plugins/i18n';
import { buildAppUrl, buildTenantUrl, extractTenant } from '@/lib/host';

const SESSION_STATUS_CODES = new Set([401, 419, 440]);
const MESSAGE_KEYWORDS = ['session expired', 'invalid token', 'invalid csrf', 'unauthorized'];

const LOGIN_PATHS = {
  teacher: '/teacher/login',
  assistant: '/teacher/assistant/login',
  student: '/student/login',
  admin: '/login/admin'
} as const;

type RoleKind = 'teacher' | 'student' | 'assistant' | 'admin';

interface SessionRedirectOptions {
  roleHint?: string | null;
  tenantHint?: string | null;
  currentUrl?: string | null;
  hadSession?: boolean;
  delayMs?: number;
}

let redirecting = false;
let redirectTimer: ReturnType<typeof setTimeout> | null = null;

const padBase64 = (input: string): string => {
  const remainder = input.length % 4;
  if (!remainder) {
    return input;
  }
  return `${input}${'='.repeat(4 - remainder)}`;
};

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }
  if (typeof atob !== 'function') {
    return null;
  }
  try {
    const normalized = padBase64(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    const decoded = atob(normalized);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const extractRoleFromClaims = (payload: Record<string, unknown> | null): string | null => {
  if (!payload) {
    return null;
  }

  const direct = payload.role;
  if (typeof direct === 'string' && direct.trim()) {
    return direct;
  }

  const arrayRoles = payload.roles;
  if (Array.isArray(arrayRoles)) {
    const candidate = arrayRoles.find((value) => typeof value === 'string' && value.trim());
    if (candidate) {
      return candidate;
    }
  }

  for (const key of Object.keys(payload)) {
    if (!key.toLowerCase().includes('role')) {
      continue;
    }
    const value = payload[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
    if (Array.isArray(value)) {
      const candidate = value.find((entry) => typeof entry === 'string' && entry.trim());
      if (candidate) {
        return candidate;
      }
    }
  }

  return null;
};

const searchRoleFromCookies = (): string | null => {
  if (typeof document === 'undefined') {
    return null;
  }
  const cookies = document.cookie.split(';');
  for (const raw of cookies) {
    const value = raw.split('=')[1];
    if (!value || !value.includes('.')) {
      continue;
    }
    const claims = decodeJwtPayload(value.trim());
    const role = extractRoleFromClaims(claims);
    if (role) {
      return role;
    }
  }
  return null;
};

const normalizeRole = (input?: string | null): RoleKind | null => {
  if (!input) {
    return null;
  }
  const upper = input.trim().toUpperCase();
  if (!upper) {
    return null;
  }
  if (upper.includes('ASSISTANT')) {
    return 'assistant';
  }
  if (upper.includes('STUDENT')) {
    return 'student';
  }
  if (upper.includes('ADMIN')) {
    return 'admin';
  }
  if (upper.includes('TEACHER')) {
    return 'teacher';
  }
  return null;
};

const resolveRole = (options: SessionRedirectOptions): RoleKind => {
  const { roleHint } = options;
  const normalizedHint = normalizeRole(roleHint ?? null);
  if (normalizedHint) {
    return normalizedHint;
  }
  const cookieRole = normalizeRole(searchRoleFromCookies());
  if (cookieRole) {
    return cookieRole;
  }
  if (typeof window !== 'undefined') {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('/student')) {
      return 'student';
    }
    if (path.includes('/assistant')) {
      return 'assistant';
    }
    if (path.includes('/admin')) {
      return 'admin';
    }
  }
  return 'teacher';
};

const resolveTenant = (role: RoleKind, tenantHint?: string | null): string | null => {
  if (role !== 'student' && role !== 'assistant') {
    return null;
  }
  const normalizedHint = typeof tenantHint === 'string' ? tenantHint.trim().toLowerCase() : '';
  if (normalizedHint) {
    return normalizedHint;
  }
  const hostTenant = extractTenant();
  if (hostTenant) {
    return hostTenant;
  }
  return 'mr-hossam';
};

const buildLoginUrl = (role: RoleKind, tenant: string | null, nextPath: string): string => {
  const base = (() => {
    switch (role) {
      case 'assistant':
        return buildAppUrl(LOGIN_PATHS.assistant);
      case 'admin':
        return buildAppUrl(LOGIN_PATHS.admin);
      case 'student': {
        const slug = tenant || 'mr-hossam';
        return buildTenantUrl(slug, LOGIN_PATHS.student);
      }
      default:
        return buildAppUrl(LOGIN_PATHS.teacher);
    }
  })();

  try {
    const url = new URL(base);
    url.searchParams.set('next', nextPath);
    if (role === 'assistant') {
      url.searchParams.set('tenant', tenant || 'mr-hossam');
    }
    return url.toString();
  } catch {
    const params = new URLSearchParams();
    params.set('next', nextPath);
    if (role === 'assistant') {
      params.set('tenant', tenant || 'mr-hossam');
    }
    const separator = base.includes('?') ? '&' : '?';
    return `${base}${separator}${params.toString()}`;
  }
};

const getCurrentPath = (provided?: string | null): string => {
  if (provided && provided.trim()) {
    return provided;
  }
  if (typeof window !== 'undefined') {
    const { pathname, search, hash } = window.location;
    return `${pathname || '/'}${search || ''}${hash || ''}`;
  }
  return '/';
};

const isAlreadyOnLoginRoute = (role: RoleKind): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  const path = window.location.pathname.toLowerCase();
  switch (role) {
    case 'assistant':
      return path.startsWith(LOGIN_PATHS.assistant);
    case 'student':
      return path === '/login' || path.startsWith(LOGIN_PATHS.student) || /\/[^/]+\/login$/.test(path);
    case 'admin':
      return path.startsWith(LOGIN_PATHS.admin);
    default:
      return path.startsWith(LOGIN_PATHS.teacher);
  }
};

const getLocalizedMessage = (locale: 'en' | 'ar'): string => {
  const messages = i18n.global.getLocaleMessage(locale) as Record<string, any>;
  return messages?.auth?.sessionExpired ??
    (locale === 'en'
      ? 'Your session has expired. Please log in again.'
      : 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى.');
};

const showSessionToast = () => {
  const toast = useToast();
  const english = getLocalizedMessage('en');
  const arabic = getLocalizedMessage('ar');
  toast.clear();
  toast.error({
    summary: english,
    detail: arabic,
    closable: false,
    life: 4500
  });
};

export const isSessionRedirecting = (): boolean => redirecting;

export const matchesSessionKeyword = (message?: string): boolean => {
  if (!message) {
    return false;
  }
  const normalized = message.toLowerCase();
  return MESSAGE_KEYWORDS.some((keyword) => normalized.includes(keyword));
};

export const shouldHandleSession = (status?: number, message?: string): boolean => {
  if (typeof status === 'number' && SESSION_STATUS_CODES.has(status)) {
    return true;
  }
  return matchesSessionKeyword(message);
};

export const triggerSessionRedirect = (options: SessionRedirectOptions = {}): void => {
  if (redirecting) {
    return;
  }
  redirecting = true;

  const role = resolveRole(options);
  if (isAlreadyOnLoginRoute(role)) {
    redirecting = false;
    return;
  }

  showSessionToast();

  const currentPath = getCurrentPath(options.currentUrl);
  const tenant = resolveTenant(role, options.tenantHint ?? null);
  const target = buildLoginUrl(role, tenant, currentPath);

  const delay = typeof options.delayMs === 'number' ? options.delayMs : 150;
  if (redirectTimer) {
    clearTimeout(redirectTimer);
  }
  redirectTimer = setTimeout(() => {
    try {
      if (typeof window !== 'undefined') {
        window.location.replace(target);
      }
    } finally {
      redirectTimer = null;
    }
  }, delay);
};

export const resetSessionRedirectState = (): void => {
  redirecting = false;
  if (redirectTimer) {
    clearTimeout(redirectTimer);
    redirectTimer = null;
  }
};

export const extractSessionMessage = (data: unknown, fallback?: string): string => {
  if (typeof data === 'string') {
    return data;
  }
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const keys = ['message', 'error', 'detail', 'description'];
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'string') {
        return value;
      }
    }
  }
  return fallback ?? '';
};
