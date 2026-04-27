<template></template>

<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { verifyTeacher } from '@/services/teacher';
import { useTenantStore } from '@/stores/tenant';
import { normalizeTenantSlug, sanitizeTenantSlug, setStoredTenantSlug } from '@/utils/tenantStorage';
import { buildAppUrl, isAppHost } from '@/lib/host';

const route = useRoute();
const router = useRouter();
const tenantStore = useTenantStore();

const toSingleString = (value: unknown) => {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : '';
  }
  return typeof value === 'string' ? value : '';
};

const getRouteTenant = () => {
  const direct = normalizeTenantSlug(toSingleString(route.query.tenant));
  if (direct) {
    return direct;
  }
  return normalizeTenantSlug(toSingleString(route.query.tenantSlug));
};

const getToken = () => {
  const queryToken = toSingleString(route.query.token).trim();
  const paramToken = toSingleString(route.params.token as unknown).trim();
  return queryToken || paramToken;
};

let verifying = false;
let processedToken = '';

const redirectToLogin = async (params: { query?: Record<string, string> } = {}) => {
  const { query = {} } = params;
  const normalizedQuery: Record<string, string> = { ...query };
  const hasQuery = Object.keys(normalizedQuery).length > 0;
  const location = {
    name: 'login-teacher',
    query: hasQuery ? normalizedQuery : undefined
  } as const;
  try {
    const resolved = router.resolve(location);
    if (!isAppHost()) {
      const targetPath = resolved.fullPath || '/teacher/login';
      window.location.replace(buildAppUrl(targetPath));
      return;
    }
    await router.replace(location);
  } catch (navigationError) {
    console.error('Failed to redirect after teacher verification', navigationError);
  }
};

const attemptVerification = async () => {
  const token = getToken();
  const tenantFromRoute = getRouteTenant();

  if (!token || verifying || token === processedToken) {
    if (!token && !verifying && processedToken !== '__redirected__') {
      processedToken = '__redirected__';
      const normalizedTenant = tenantFromRoute;
      await redirectToLogin({ query: normalizedTenant ? {} : undefined });
    }
    return;
  }

  verifying = true;
  processedToken = token;

  try {
    const response = await verifyTeacher({ token });
    const slug = normalizeTenantSlug(response.slug || tenantFromRoute);
    const resolvedTenant = sanitizeTenantSlug(slug);
    if (resolvedTenant) {
      tenantStore.setSlug(resolvedTenant);
      setStoredTenantSlug(resolvedTenant);
    }
    const query: Record<string, string> = { verified: 'teacher' };
    await redirectToLogin({ query });
  } catch (err) {
    console.error('Automatic teacher verification failed', err);
    const query: Record<string, string> = { verification: 'failed' };
    await redirectToLogin({ query });
  } finally {
    verifying = false;
  }
};

onMounted(() => {
  void attemptVerification();
});

watch(
  () => [route.query.token, route.params.token, route.query.tenant, route.query.tenantSlug],
  () => {
    void attemptVerification();
  }
);
</script>

