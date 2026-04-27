<template>
  <ThemePage>
    <section class="auth-page sign-in">
      <div class="auth-card">
        <header class="auth-card__header">
          <div class="auth-card__icon">
            <UiIcon name="SolutionOutlined" :size="28" />
          </div>
        <div>
          <h2>{{ t('student.loginTitle') }}</h2>
          <p>{{ loginSubtitle }}</p>
        </div>
      </header>
      <UiAlert
        v-if="infoMessage"
        :color="infoMessageColor"
        variant="soft"
        class="auth-info"
      >
        {{ infoMessage }}
      </UiAlert>
      <form class="auth-form" @submit.prevent="submit">
          <label class="auth-field">
            <span>{{ t('student.email') }}</span>
            <div class="auth-input">
              <UiIcon name="MailOutlined" :size="18" />
              <input v-model="form.email" type="email" required autocomplete="username" />
            </div>
          </label>
          <label class="auth-field">
            <span>{{ t('student.password') }}</span>
            <div class="auth-input">
              <UiIcon name="LockOutlined" :size="18" />
              <input v-model="form.password" type="password" required autocomplete="current-password" />
            </div>
          </label>
          <p class="auth-context">
            {{ tenantContext }}
          </p>
          <p v-if="errorMessage" class="auth-error">{{ errorMessage }}</p>
          <button class="auth-submit" type="submit" :disabled="loading">
            <span v-if="loading" class="loader"></span>
            <span>{{ loading ? t('common.loading') : t('student.loginAction') }}</span>
          </button>
        </form>
        <div class="auth-links">
          <RouterLink :to="forgotPasswordLink">{{ t('auth.forgotPassword.link') }}</RouterLink>
          <RouterLink :to="registerLink">{{ t('student.needAccount') }}</RouterLink>
         </div>
      </div>
    </section>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { RouteLocationRaw } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { isAxiosError } from 'axios';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import { useTenantStore } from '@/stores/tenant';
import { DEFAULT_TENANT_SLUG, getStoredTenantSlug, setStoredTenantSlug } from '@/utils/tenantStorage';
import { safeRedirect } from '@/lib/safeRedirect';
import { handleApiError } from '@/composables/useApiError';
import UiIcon from '@/components/ui/UiIcon.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import { extractTenant, buildTenantUrl } from '@/lib/host';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const auth = useAuthStore();
const tenantStore = useTenantStore();

const form = reactive({
  email: '',
  password: ''
});

const loading = ref(false);
const errorMessage = ref('');
const infoMessage = ref('');
const infoMessageColor = ref<'info' | 'success'>('info');
const suppressNextMessageUpdate = ref(false);
const tenantSlug = ref('');
const isLocalDevHost =
  typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);

const registerLink = computed(() => {
  const slug = tenantSlug.value.trim();
  return slug ? { name: 'student-register', query: { tenant: slug } } : { name: 'student-register' };
});

const forgotPasswordLink = computed(() => {
  const slug = tenantSlug.value.trim();
  return slug ? { name: 'student-forgot-password', query: { tenant: slug } } : { name: 'student-forgot-password' };
});

const loginSubtitle = computed(() => tenantStore.branding?.branding?.tagline || t('student.loginSubtitle'));
const tenantContext = computed(() => {
  if (tenantSlug.value) {
    const name = tenantStore.branding?.name || tenantStore.branding?.branding?.name || tenantSlug.value;
    return t('student.loginTenantContext', { tenant: name });
  }
  return t('student.loginTenantPrompt');
});

const studentDefaultPath = '/student/home';

const sanitizeRedirect = (raw: string | null | undefined, fallback: string): string => {
  const candidate = safeRedirect(typeof raw === 'string' ? raw : '', fallback);
  if (candidate.startsWith('/student') || candidate.startsWith('/assistant')) {
    return candidate;
  }
  return fallback;
};
const redirectTarget = ref(studentDefaultPath);

const hydrateRedirect = () => {
  const nextRaw = route.query.next;
  const redirectRaw = route.query.redirect;
  const value = Array.isArray(nextRaw)
    ? nextRaw[0]
    : typeof nextRaw === 'string'
      ? nextRaw
      : Array.isArray(redirectRaw)
        ? redirectRaw[0]
        : redirectRaw;
  const fallbackRoute = router.resolve({ name: 'student-dashboard' });
  const fallbackPath = fallbackRoute?.path || studentDefaultPath;
  redirectTarget.value = sanitizeRedirect(typeof value === 'string' ? value : '', fallbackPath);
};

hydrateRedirect();

const ensureBranding = async (tenant?: string) => {
  const normalized = tenant?.trim();
  if (normalized) {
    if (!tenantStore.branding || tenantStore.branding.slug !== normalized) {
      await tenantStore.fetchBranding(normalized);
    }
    return;
  }
  if (!tenantStore.branding) {
    await tenantStore.fetchBranding();

  }
};

const extractTenantFromRoute = () => {
  const paramTenant = typeof route.params?.tenant === 'string' ? route.params.tenant.trim() : '';
  if (paramTenant) {
    return paramTenant;
  }
  const tenantQuery = Array.isArray(route.query.tenant) ? route.query.tenant[0] : route.query.tenant;
  return typeof tenantQuery === 'string' ? tenantQuery.trim() : '';
};

const syncTenant = async () => {
  const slugFromRoute = extractTenantFromRoute();
  const stored = getStoredTenantSlug().raw;
  const nextSlug = slugFromRoute || stored;
  const trimmed = nextSlug.trim();
  tenantSlug.value = trimmed;
  if (trimmed) {
    setStoredTenantSlug(trimmed);
  }
  await ensureBranding(trimmed);
};

const maybeClearDefaultTenant = () => {
  if (!isLocalDevHost) {
    return;
  }

  const routeTenant = extractTenantFromRoute();
  if (routeTenant) {
    return;
  }

  const stored = getStoredTenantSlug();
  const storedCandidate = stored.raw || stored.normalized;
  const currentCandidate = tenantStore.rawSlug || tenantStore.slug || '';
  const looksLikeDefault = (value: string | undefined | null) =>
    !!value && value.trim().toLowerCase() === DEFAULT_TENANT_SLUG;

  if (!storedCandidate && !currentCandidate) {
    return;
  }

  if (looksLikeDefault(storedCandidate) || looksLikeDefault(currentCandidate)) {
    tenantStore.setSlug('');
  }
};

const toSingleString = (value: unknown): string => {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : '';
  }
  return typeof value === 'string' ? value : '';
};

const clearMessageQuery = (keys: string[]) => {
  const nextQuery = { ...route.query } as Record<string, unknown>;
  let mutated = false;
  for (const key of keys) {
    if (key in nextQuery) {
      delete nextQuery[key];
      mutated = true;
    }
  }
  if (mutated) {
    suppressNextMessageUpdate.value = true;
    router
      .replace({
        name: (route.name as string) || 'login-student',
        params: route.params,
        query: nextQuery
      })
      .catch((navigationError) =>
        console.warn('Failed to clear login query params', navigationError)
      );
  }
};

const updateInfoMessage = () => {
  if (suppressNextMessageUpdate.value) {
    suppressNextMessageUpdate.value = false;
    return;
  }
  const registered = toSingleString(route.query.registered).toLowerCase();
  const verified = toSingleString(route.query.verified).toLowerCase();

  if (registered === 'student') {
    infoMessage.value = t('student.checkEmailNotice');
    infoMessageColor.value = 'info';
    clearMessageQuery(['registered']);
    return;
  }

  if (verified === 'student') {
    infoMessage.value = t('student.verifyRedirectNotice');
    infoMessageColor.value = 'success';
    clearMessageQuery(['verified']);
    return;
  }

  if (!registered && !verified) {
    infoMessage.value = '';
  }
};

onMounted(async () => {
  maybeClearDefaultTenant();
  await syncTenant();
  updateInfoMessage();
});

watch(
  () => route.query.tenant,
  () => {
    syncTenant();

  }
);

watch(
  () => [route.query.next, route.query.redirect],
  () => {
    hydrateRedirect();
  }
);

watch(
  () => [route.query.registered, route.query.verified],
  () => {
    updateInfoMessage();
  }
);

const consumeRedirectQueryOnce = async () => {
  const nextQuery = { ...route.query } as Record<string, unknown>;
  const keys: Array<'next' | 'redirect'> = ['next', 'redirect'];
  let mutated = false;
  for (const key of keys) {
    if (key in nextQuery) {
      delete nextQuery[key];
      mutated = true;
    }
  }
  if (!mutated) {
    return;
  }
  const location: RouteLocationRaw = {
    path: route.path,
    query: nextQuery,
    hash: route.hash
  };
  await router.replace(location);
};

const handleTenantHostLogin = async (hostTenant: string) => {
  const normalized = hostTenant.trim().toLowerCase();
  tenantSlug.value = normalized;
  if (normalized) {
    setStoredTenantSlug(normalized);
    tenantStore.setSlug(normalized);
  }
  try {
    await auth.me(true);
  } catch (err) {
    console.warn('Failed to refresh auth state after student login', err);
  }
  if (normalized) {
    try {
      await tenantStore.fetchBranding(normalized);
    } catch (brandingError) {
      console.warn('Failed to refresh branding after student login', brandingError);
    }
  }
  const fallbackRoute = router.resolve({ name: 'student-dashboard' });
  const fallbackPath = fallbackRoute?.path || studentDefaultPath;
  const destination = redirectTarget.value || fallbackPath;
  await consumeRedirectQueryOnce();
  await router.replace(destination);
};

const handleGenericStudentLogin = async () => {
  const redirectPath = redirectTarget.value || studentDefaultPath;
  try {
    await auth.me(true).catch(() => undefined);
    const { data } = await api.get<StudentTenantSelectionResponse>('/v1/student/tenants');
    const nextTenant = typeof data.nextTenant === 'string' ? data.nextTenant.trim().toLowerCase() : '';
    if (nextTenant) {
      const target = buildTenantUrl(nextTenant, `/login?next=${encodeURIComponent(redirectPath)}`);
      window.location.replace(target);
      return;
    }
    const tenants = Array.isArray(data.tenants) ? data.tenants : [];
    if (data.needChoice && tenants.length > 0) {
      await router.replace({ name: 'student-choose-tenant', query: { next: redirectPath } });
      return;
    }
    if (tenants.length === 1 && typeof tenants[0]?.slug === 'string') {
      const fallbackSlug = tenants[0].slug.trim().toLowerCase();
      if (fallbackSlug) {
        const target = buildTenantUrl(fallbackSlug, `/login?next=${encodeURIComponent(redirectPath)}`);
        window.location.replace(target);
        return;
      }
    }
    errorMessage.value = t('student.loginMissingTenant');
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 403) {
      errorMessage.value = t('student.loginNoTenants');
      return;
    }
    throw error;
  }
};

const submit = async () => {
  loading.value = true;
  errorMessage.value = '';
  const slug = tenantSlug.value.trim();
  const hostTenant = extractTenant();

  try {
    await api.post<LoginResponse>('/v1/auth/login', {
      email: form.email,
      password: form.password,
      role: 'STUDENT',
      slug: slug || undefined,
      tenant: slug || undefined
    });
    if (hostTenant) {
      await handleTenantHostLogin(hostTenant);
      return;
    }
    await handleGenericStudentLogin();
  } catch (e) {
    console.error('Student login failed', e);
    errorMessage.value = resolveStudentLoginError(e);
  } finally {
    loading.value = false;
  }
};

interface LoginResponse {
  tenantSlug?: string | null;
}

interface StudentTenantSummary {
  slug: string;
  displayName?: string | null;
  logoUrl?: string | null;
}

interface StudentTenantSelectionResponse {
  nextTenant?: string | null;
  needChoice?: boolean;
  tenants?: StudentTenantSummary[] | null;
}

const resolveStudentLoginError = (error: unknown): string => {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const rawMessage = String(error.response?.data?.message || '').trim();
    const message = rawMessage.toLowerCase();
    const containsAny = (needles: string[]) => needles.some((needle) => needle && message.includes(needle));

    if (status === 400 && message.includes('tenant')) {
      return t('student.loginMissingTenant');
    }
    if (status === 423 || containsAny(['disabled', 'deactivated', 'suspended', 'locked'])) {
      return t('student.loginDisabled');
    }
    if (
      containsAny([
        'verify',
        'activation',
        'activate',
        'not verified',
        'unverified',
        'pending verification',
        'inactive'
      ])
    ) {
      return t('student.loginVerificationRequired');
    }
    if (status === 401 || containsAny(['invalid credentials', 'unauthorized'])) {
      return t('student.loginError');
    }
    if (rawMessage) {
      return rawMessage;
    }
  }

  return handleApiError(error, {
    fallback: t('student.loginError'),
    useToast: false
  });
};
</script>

<style scoped>
.auth-context {
  margin: 0 0 1.5rem;
  color: var(--sakai-text-color-secondary);
  line-height: 1.5;
}

.auth-info {
  margin-bottom: 1rem;
}
</style>
