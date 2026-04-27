

<template></template>

<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { isAxiosError } from 'axios';
import { useRoute, useRouter } from 'vue-router';
import { verifyStudent } from '@/services/student';
import { useTenantStore } from '@/stores/tenant';
import {
  getStoredTenantSlug,
  sanitizeTenantSlug,
  setStoredTenantSlug
} from '@/utils/tenantStorage';

const route = useRoute();
const router = useRouter();
const tenantStore = useTenantStore();

const toSingleString = (value: unknown) => {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : '';
  }
  return typeof value === 'string' ? value : '';
};

const PLACEHOLDER_TENANT_SLUGS = new Set(['localhost', '127.0.0.1']);

const normalizeRouteTenant = (value: string) => {
  const sanitized = sanitizeTenantSlug(value);
  if (!sanitized) {
    return '';
  }
  return PLACEHOLDER_TENANT_SLUGS.has(sanitized.toLowerCase()) ? '' : sanitized;
};

const getTenantSlugFromRoute = () => {
  const direct = normalizeRouteTenant(toSingleString(route.query.tenant));
  if (direct) {
    return direct;
  }
  return normalizeRouteTenant(toSingleString(route.query.tenantSlug));
};

const getStudentIdFromRoute = () => {
  const queryId = toSingleString(route.query.studentId).trim();
  if (queryId) {
    return queryId;
  }
  const paramId = toSingleString(route.params.studentId as unknown).trim();
  return paramId;
};

const buildTenantCandidates = (): (string | undefined)[] => {
  const prioritized: string[] = [];
  const placeholders: string[] = [];
  const seen = new Set<string>();

  const addCandidate = (value?: string | null) => {
    const sanitized = sanitizeTenantSlug(value);
    if (!sanitized) {
      return;
    }
    const normalized = sanitized.toLowerCase();
    if (seen.has(normalized)) {
      return;
    }
    seen.add(normalized);
    if (PLACEHOLDER_TENANT_SLUGS.has(normalized)) {
      placeholders.push(sanitized);
    } else {
      prioritized.push(sanitized);
    }
  };

  addCandidate(toSingleString(route.query.tenant));
  addCandidate(toSingleString(route.query.tenantSlug));
  addCandidate(tenantStore.rawSlug);
  addCandidate(tenantStore.slug);
  addCandidate(tenantStore.branding?.slug as string | undefined);
  const stored = getStoredTenantSlug();
  addCandidate(stored.raw);
  addCandidate(stored.normalized);
  addCandidate(import.meta.env.VITE_TENANT_SLUG);

  return [...prioritized, ...placeholders, undefined];
};

const pickRedirectTenant = (candidates: (string | undefined)[]) => {
  const fromRoute = getTenantSlugFromRoute();
  if (fromRoute) {
    return fromRoute;
  }
  const firstValid = candidates.find(
    (candidate) =>
      typeof candidate === 'string' &&
      !PLACEHOLDER_TENANT_SLUGS.has(candidate.toLowerCase())
  );
  return typeof firstValid === 'string' ? firstValid : '';
};

const shouldRetryWithNextTenant = (error: unknown): boolean => {
  if (!isAxiosError(error)) {
    return false;
  }
  const status = error.response?.status;
  if (!status) {
    return false;
  }
  return status === 400 || status === 403 || status === 404;
};

const getToken = () => {
  const queryToken = toSingleString(route.query.token).trim();
  const paramToken = toSingleString(route.params.token as unknown).trim();
  return queryToken || paramToken;
};

let verifying = false;
let processedToken = '';

const redirectToLogin = async (query: Record<string, string>) => {
  try {
    const { tenant, ...rest } = query;
    const sanitizedTenant = typeof tenant === 'string' && tenant.trim() ? tenant.trim() : '';
    const location = sanitizedTenant
      ? {
          name: 'login-student',
          params: { tenant: sanitizedTenant },
          query: Object.keys(rest).length ? rest : undefined
        }
      : {
          name: 'login-student-fallback',
          query: Object.keys(rest).length ? rest : undefined
        };
    await router.replace(location);
  } catch (navigationError) {
    console.error('Failed to redirect after student verification', navigationError);
  }
};

const attemptVerification = async () => {
  const token = getToken();
  if (!token || verifying || token === processedToken) {
    if (!token && !verifying && processedToken !== '__redirected__') {
      processedToken = '__redirected__';
      const tenant = getTenantSlugFromRoute();
      const query: Record<string, string> = tenant ? { tenant } : {};
      const studentId = getStudentIdFromRoute();
      if (studentId) {
        query.studentId = studentId;
      }
      await redirectToLogin(query);
    }
    return;
  }

  verifying = true;
  processedToken = token;

  const tenantCandidates = buildTenantCandidates();
  let lastError: unknown;
  const studentId = getStudentIdFromRoute();

  for (const candidate of tenantCandidates) {
    try {
      const verificationParams: {
        tenant?: string;
        studentId?: string;
        tenantHeader?: string;
      } = {};
      if (candidate) {
        verificationParams.tenant = candidate;
        verificationParams.tenantHeader = candidate;
      }
      if (studentId) {
        verificationParams.studentId = studentId;
      }
      const response = await verifyStudent({ token }, verificationParams);
      const resolvedTenant = sanitizeTenantSlug(
        response.teacherSlug || candidate || getTenantSlugFromRoute()
      );
      if (resolvedTenant) {
        tenantStore.setSlug(resolvedTenant);
        setStoredTenantSlug(resolvedTenant);
      }
      const query: Record<string, string> = { verified: 'student' };
      if (resolvedTenant) {
        query.tenant = resolvedTenant;
      }
      if (studentId) {
        query.studentId = studentId;
      }
      await redirectToLogin(query);
      verifying = false;
      return;
    } catch (error) {
      lastError = error;
      if (!shouldRetryWithNextTenant(error)) {
        break;
      }
    }
  }

  console.error('Automatic student verification failed', lastError);
  const tenant = pickRedirectTenant(tenantCandidates);
  const query: Record<string, string> = {};
  if (tenant) {
    query.tenant = tenant;
  }
  query.verification = 'failed';
  if (studentId) {
    query.studentId = studentId;
  }
  await redirectToLogin(query);
  verifying = false;
};

onMounted(() => {
  void attemptVerification();
});

watch(
  () => [
    route.query.token,
    route.params.token,
    route.query.tenant,
    route.query.tenantSlug,
    route.query.studentId,
    route.params.studentId
  ],
  () => {
    void attemptVerification();
  }
);
</script>
