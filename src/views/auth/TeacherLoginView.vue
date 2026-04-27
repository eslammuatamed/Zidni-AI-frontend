<template>
  <ThemePage>
    <UiDialog
      v-if="isAssistantMode"
      v-model="tenantDialog.open"
      :title="t(`${roleNamespace}.loginTenantDialogTitle`)"
      width="420px"
      :closable="false"
      :mask-closable="false"
    >
      <p class="tenant-dialog__description">{{ t(`${roleNamespace}.loginTenantDialogDescription`) }}</p>
      <form class="tenant-dialog__form" @submit.prevent="submitTenantDialog">
        <label class="tenant-dialog__label">
          <span>{{ t(`${roleNamespace}.loginTenantDialogLabel`) }}</span>
          <input
            v-model="tenantDialog.value"
            class="tenant-dialog__input"
            type="text"
            :placeholder="t(`${roleNamespace}.loginTenantDialogPlaceholder`)"
            autocomplete="off"
            spellcheck="false"
          />
        </label>
        <p v-if="tenantDialog.error" class="auth-error tenant-dialog__error">{{ tenantDialog.error }}</p>
        <button class="auth-submit tenant-dialog__submit" type="submit" :disabled="tenantDialog.submitting">
          <span v-if="tenantDialog.submitting" class="loader"></span>
          <span>
            {{ tenantDialog.submitting ? t('common.loading') : t(`${roleNamespace}.loginTenantDialogSubmit`) }}
          </span>
        </button>
      </form>
    </UiDialog>
    <section class="auth-page sign-in">
      <div class="auth-card">
        <header class="auth-card__header">
          <div class="auth-card__icon">
            <UiIcon name="UserSwitchOutlined" :size="28" />
          </div>
          <div>
            <h2>{{ t(`${roleNamespace}.login`) }}</h2>
            <p>{{ t(`${roleNamespace}.loginSubtitle`) }}</p>
          </div>
        </header>
        <UiAlert
          v-if="!isAssistantMode && infoMessage"
          :color="infoMessageColor"
          variant="soft"
          class="auth-info"
        >
          {{ infoMessage }}
        </UiAlert>
        <form class="auth-form" @submit.prevent="submit">
          <label class="auth-field">
            <span>{{ t(`${roleNamespace}.email`) }}</span>
            <div class="auth-input">
              <UiIcon name="MailOutlined" :size="18" />
              <input v-model="form.email" type="email" required autocomplete="username" />
            </div>
          </label>
          <label class="auth-field">
            <span>{{ t(`${roleNamespace}.password`) }}</span>
            <div class="auth-input">
              <UiIcon name="LockOutlined" :size="18" />
              <input v-model="form.password" type="password" required autocomplete="current-password" />
            </div>
          </label>
          <p class="auth-context">{{ tenantContext }}</p>
          <p v-if="tenantErrorMessage" class="auth-error">{{ tenantErrorMessage }}</p>
          <p v-if="errorMessage" class="auth-error">{{ errorMessage }}</p>
          <button class="auth-submit" type="submit" :disabled="loading || !canSubmit">
            <span v-if="loading" class="loader"></span>
            <span>{{ loading ? t('common.loading') : t(`${roleNamespace}.submit`) }}</span>
          </button>
        </form>
     
        <div class="auth-links">
          <RouterLink :to="forgotPasswordLink">{{ t('auth.forgotPassword.link') }}</RouterLink>
          <template v-if="isAssistantMode">
            <RouterLink :to="{ name: missingTenantRouteName }">
              {{ t('assistant.backToTeacherLogin') }}
            </RouterLink>
          </template>
          <template v-else>
             <RouterLink :to="{ name: 'teacher-register' }">{{ t('teacher.needAccount') }}</RouterLink>
          </template>
        </div>
      </div>
    </section>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { RouteLocationRaw } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { isAxiosError } from 'axios';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import { useTenantStore } from '@/stores/tenant';
import { handleApiError } from '@/composables/useApiError';
import { safeRedirect } from '@/lib/safeRedirect';
import { switchTenant as switchTenantSession } from '@/services/tenantMembership';
import UiIcon from '@/components/ui/UiIcon.vue';
import UiDialog from '@/components/ui/UiDialog.vue';
import UiAlert from '@/components/ui/UiAlert.vue';

const router = useRouter();
const route = useRoute();
const { t } = useI18n();
const auth = useAuthStore();
const tenantStore = useTenantStore();

const isAssistantMode = computed(() => route.meta.authRole === 'TEACHER_ASSISTANT');
const roleNamespace = computed(() => (isAssistantMode.value ? 'assistant' : 'teacher'));
const loginRouteName = computed(() => (isAssistantMode.value ? 'assistant-login' : 'login-teacher'));
const missingTenantRouteName = computed(() => 'login-teacher');
const forgotPasswordRouteName = computed(() =>
  isAssistantMode.value ? 'assistant-forgot-password' : 'teacher-forgot-password'
);
const dashboardRouteName = computed(() => (isAssistantMode.value ? 'assistant-dashboard' : 'teacher-dashboard'));
const loginPathPrefix = computed(() => (isAssistantMode.value ? 'assistant' : 'teacher'));
const targetRole = computed(() => (isAssistantMode.value ? 'TEACHER_ASSISTANT' : 'TEACHER'));
const requiresTenantSlug = computed(() => isAssistantMode.value);
const routeTenant = computed(() => {
  const tenantFromQuery = normalizeTenantParam(route.query.tenant);
  if (tenantFromQuery) {
    return tenantFromQuery;
  }
  return normalizeTenantParam(route.params.tenant);
});

const forgotPasswordLink = computed<RouteLocationRaw>(() => {
  const tenant = routeTenant.value;
  const link: RouteLocationRaw = { name: forgotPasswordRouteName.value };
  if (tenant) {
    link.query = { tenant };
  }
  return link;
});

const form = reactive({
  email: '',
  password: ''
});

const loading = ref(false);
const errorMessage = ref('');
const tenantErrorMessage = ref('');
const tenantLoading = ref(false);
let tenantRequestToken = 0;

const tenantDialog = reactive({
  open: false,
  value: '',
  error: '',
  submitting: false
});

const tenantContext = computed(() => {
  const tenantName = tenantStore.branding?.name;
  const namespace = roleNamespace.value;
  if (tenantName) {
    return t(`${namespace}.loginTenantContext`, { tenant: tenantName });
  }
  return t(`${namespace}.loginTenantPrompt`);
});

const slugExample = computed(() => {
  const tenantSlug = (tenantStore.slug || '').trim().toLowerCase();
  if (tenantSlug) {
    return tenantSlug;
  }
  const slugFromRoute = routeTenant.value;
  if (slugFromRoute) {
    return slugFromRoute;
  }
  const fallback = (import.meta.env.VITE_TENANT_SLUG || '').trim().toLowerCase();
  return fallback || 'my-academy';
});

const canonicalLoginPath = computed(() => `/${loginPathPrefix.value}/login`);
const loginLink = computed(() => {
  const slug = slugExample.value;
  if (!slug) {
    return canonicalLoginPath.value;
  }
  if (import.meta.env.PROD) {
    return `https://${slug}.zidni.cloud${canonicalLoginPath.value}`;
  }
  const base = (import.meta.env.VITE_DEV_DOMAIN_BASE || '127.0.0.1.nip.io').trim().replace(/^\.+|\.+$/g, '');
  return `http://${slug}.${base}:5173${canonicalLoginPath.value}`;
});

const infoMessage = ref('');
const infoMessageColor = ref<'info' | 'success'>('info');
const suppressNextMessageUpdate = ref(false);

const normalizeTenantParam = (value: unknown) => {
  if (Array.isArray(value)) {
    return (value[0] || '').trim().toLowerCase();
  }
  if (typeof value === 'string') {
    return value.trim().toLowerCase();
  }
  return '';
};

const toSingleString = (value: unknown): string => {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : '';
  }
  return typeof value === 'string' ? value : '';
};

const getCurrentParams = () => {
  const params: Record<string, string> = {};
  Object.entries(route.params).forEach(([key, value]) => {
    if (typeof value === 'string' || typeof value === 'number') {
      params[key] = String(value);
    }
  });
  return params;
};

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
    name: typeof route.name === 'string' ? route.name : undefined,
    params: getCurrentParams(),
    query: nextQuery,
    hash: route.hash
  };
  if (!location.name) {
    location.path = route.path;
  }
  await router.replace(location);
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
      .replace({ name: loginRouteName.value, params: getCurrentParams(), query: nextQuery })
      .catch((navigationError) => console.warn('Failed to clear teacher login query params', navigationError));
  }
};

const updateInfoMessage = () => {
  if (isAssistantMode.value) {
    infoMessage.value = '';
    return;
  }
  if (suppressNextMessageUpdate.value) {
    suppressNextMessageUpdate.value = false;
    return;
  }
  const registered = toSingleString(route.query.registered).toLowerCase();
  const verified = toSingleString(route.query.verified).toLowerCase();

  if (registered === 'teacher') {
    infoMessage.value = t('teacher.checkEmailNotice');
    infoMessageColor.value = 'info';
    clearMessageQuery(['registered']);
    return;
  }

  if (verified === 'teacher') {
    infoMessage.value = t('teacher.verifyRedirectNotice');
    infoMessageColor.value = 'success';
    clearMessageQuery(['verified']);
    return;
  }

  if (!registered && !verified) {
    infoMessage.value = '';
  }
};

const isMissingTenantRoute = computed(() => isAssistantMode.value && !routeTenant.value && !tenantStore.slug);

const loadTenantFromRoute = async (tenantParam: unknown) => {
  const normalizedSlug = normalizeTenantParam(tenantParam);
  tenantRequestToken += 1;
  const currentToken = tenantRequestToken;
  tenantLoading.value = true;
  tenantErrorMessage.value = '';
  errorMessage.value = '';

  if (!normalizedSlug) {
    tenantStore.setSlug('');
    tenantLoading.value = false;
    if (isAssistantMode.value && !isMissingTenantRoute.value) {
      tenantErrorMessage.value = t(`${roleNamespace.value}.loginTenantInvalid`);
    } else {
      tenantErrorMessage.value = '';
    }
    return;
  }

  try {
    tenantStore.setSlug(normalizedSlug);
    if (!tenantStore.branding || tenantStore.branding.slug !== normalizedSlug) {
      await tenantStore.fetchBranding(normalizedSlug);
    }
    if (currentToken === tenantRequestToken) {
      tenantErrorMessage.value = '';
    }
  } catch (err) {
    console.warn('Failed to load tenant branding for login', err);
    if (currentToken === tenantRequestToken) {
      tenantErrorMessage.value = t(`${roleNamespace.value}.loginTenantInvalid`);
    }
  } finally {
    if (currentToken === tenantRequestToken) {
      tenantLoading.value = false;
    }
  }
};

watch(
  routeTenant,
  (tenantParam) => {
    void loadTenantFromRoute(tenantParam);
  },
  { immediate: true }
);

watch(
  [isMissingTenantRoute, isAssistantMode],
  ([missing, assistantMode]) => {
    if (!assistantMode) {
      tenantDialog.open = false;
      tenantDialog.value = '';
      tenantDialog.error = '';
      tenantDialog.submitting = false;
      updateInfoMessage();
      return;
    }

    if (missing) {
      tenantDialog.open = true;
      tenantDialog.value = '';
      tenantDialog.error = '';
      tenantDialog.submitting = false;
    } else {
      tenantDialog.open = false;
    }
  },
  { immediate: true }
);

watch(
  () => [route.query.registered, route.query.verified],
  () => {
    updateInfoMessage();
  }
);

updateInfoMessage();

const resolveDashboardPath = () => {
  const fallbackRoute = router.resolve({ name: dashboardRouteName.value });
  if (fallbackRoute?.path) {
    return fallbackRoute.path;
  }
  return isAssistantMode.value ? '/teacher/assistant' : '/teacher/home';
};

const redirectTarget = ref(resolveDashboardPath());

const hydrateRedirect = () => {
  const nextRaw = route.query.next;
  const redirectRaw = route.query.redirect;
  const candidateValue = Array.isArray(nextRaw)
    ? nextRaw[0]
    : typeof nextRaw === 'string'
      ? nextRaw
      : Array.isArray(redirectRaw)
        ? redirectRaw[0]
        : redirectRaw;
  const fallbackPath = resolveDashboardPath();
  const candidate = safeRedirect(
    typeof candidateValue === 'string' ? candidateValue : '',
    fallbackPath
  );
  if (candidate.startsWith('/teacher')) {
    redirectTarget.value = candidate;
    return;
  }
  redirectTarget.value = fallbackPath;
};

hydrateRedirect();

watch(
  () => [route.query.next, route.query.redirect],
  () => {
    hydrateRedirect();
  }
);

const ensureTenantSession = async (slug: string) => {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) {
    return;
  }
  try {
    await switchTenantSession(normalized);
  } catch (err) {
    console.warn('Failed to bind session to tenant before redirect', err);
  }
  try {
    await tenantStore.fetchBranding(normalized);
  } catch (err) {
    console.warn('Failed to load tenant branding after login', err);
  }
};

const resolveLoginError = (error: unknown): string => {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const rawMessage = String(error.response?.data?.message || '').trim();
    const lowerMessage = rawMessage.toLowerCase();
    const containsAny = (needles: string[]) =>
      needles.some((needle) => needle && lowerMessage.includes(needle));

    if (status === 400 && containsAny(['tenant'])) {
      return t(`${roleNamespace.value}.loginTenantInvalid`);
    }
    if (status === 423 || containsAny(['disabled', 'deactivated', 'suspended', 'locked'])) {
      return t(`${roleNamespace.value}.loginDisabled`);
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
      return t(`${roleNamespace.value}.loginVerificationRequired`);
    }
    if (status === 401 || containsAny(['invalid credentials', 'unauthorized'])) {
      return t(`${roleNamespace.value}.loginError`);
    }
    if (rawMessage) {
      return rawMessage;
    }
  }

  return handleApiError(error, {
    fallback: t(`${roleNamespace.value}.loginError`),
    useToast: false
  });
};

interface LoginResponse {
  tenantSlug?: string | null;
}

const canSubmit = computed(() => {
  if (tenantLoading.value) {
    return false;
  }

  if (requiresTenantSlug.value) {
    return Boolean(tenantStore.slug) && !tenantErrorMessage.value;
  }

  return !tenantErrorMessage.value;
});

const extractTenantSlug = (input: string, prefix: string) => {
  const normalized = input.trim().toLowerCase();
  if (!normalized) {
    return '';
  }

  if (/^[a-z0-9-]+$/.test(normalized)) {
    return normalized;
  }

  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const slugFromUrl = normalized.match(new RegExp(`${escapedPrefix}/([^/]+)(?:/login)?`));
  if (slugFromUrl && slugFromUrl[1]) {
    return slugFromUrl[1].trim();
  }

  return '';
};

const submitTenantDialog = async () => {
  const extracted = extractTenantSlug(tenantDialog.value, loginPathPrefix.value);
  if (!extracted) {
    tenantDialog.error = t(`${roleNamespace.value}.loginTenantDialogError`);
    return;
  }

  tenantDialog.error = '';
  tenantDialog.submitting = true;
  try {
    const nextQuery = { ...route.query, tenant: extracted };
    await router.replace({
      name: loginRouteName.value,
      params: route.params,
      query: nextQuery
    });
    tenantDialog.open = false;
  } catch (err) {
    console.error('Failed to redirect to tenant login with slug', err);
    tenantDialog.error = t(`${roleNamespace.value}.loginTenantDialogError`);
  } finally {
    tenantDialog.submitting = false;
  }
};

const submit = async () => {
  if (tenantLoading.value) {
    return;
  }

  if (!canSubmit.value) {
    if (requiresTenantSlug.value && !tenantStore.slug) {
      tenantErrorMessage.value = t(`${roleNamespace.value}.loginTenantInvalid`);
    }
    return;
  }

  loading.value = true;
  errorMessage.value = '';
  try {
    if (!isAssistantMode.value) {
      await api.post<LoginResponse>('/v1/auth/login', {
        email: form.email,
        password: form.password,
        role: 'TEACHER'
      });
      await auth.me(true);
      const fallbackPath = resolveDashboardPath();
      const nextPath = redirectTarget.value || fallbackPath;
      await consumeRedirectQueryOnce();
      await router.replace(nextPath);
      return;
    }

    const tenantSlug = (tenantStore.slug || '').trim();
    const normalizedTenant = tenantSlug.toLowerCase();
    if (requiresTenantSlug.value && !normalizedTenant) {
      tenantErrorMessage.value = t(`${roleNamespace.value}.loginTenantInvalid`);
      return;
    }

    const { data } = await api.post<LoginResponse>('/v1/auth/login', {
      email: form.email,
      password: form.password,
      role: targetRole.value,
      slug: normalizedTenant || undefined,
      tenant: normalizedTenant || undefined
    });
    await auth.me(true);
    const resolvedTenant = (data?.tenantSlug || normalizedTenant || '').trim().toLowerCase();
    if (resolvedTenant) {
      await ensureTenantSession(resolvedTenant);
    }
    const fallbackPath = resolveDashboardPath();
    const destination = redirectTarget.value || fallbackPath;
    await consumeRedirectQueryOnce();
    await router.replace(destination);
  } catch (e) {
    console.error('Tenant role login failed', e);
    errorMessage.value = resolveLoginError(e);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.tenant-dialog__description {
  margin: 0;
  color: var(--sakai-text-color-secondary);
  line-height: 1.5;
}

.tenant-dialog__form {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
}

.tenant-dialog__label {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-2);
  color: var(--sakai-text-color);
  font-weight: var(--sakai-font-weight-medium);
}

.tenant-dialog__input {
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 80%, transparent);
  border-radius: var(--sakai-border-radius-md);
  padding: 0.625rem 0.75rem;
  font-size: 1rem;
  background: var(--sakai-surface);
  color: var(--sakai-text-color);
  transition:
    border-color var(--sakai-transition-duration) var(--sakai-transition-ease),
    box-shadow var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.tenant-dialog__input:focus {
  outline: none;
  border-color: var(--sakai-primary);
  box-shadow: 0 0 0 0.125rem color-mix(in srgb, var(--sakai-primary) 20%, transparent);
}

.tenant-dialog__error {
  margin: 0;
}

.tenant-dialog__submit {
  margin-top: var(--sakai-space-2);
}

.auth-context {
  margin: 0 0 1.5rem;
  color: var(--sakai-text-color-secondary);
  line-height: 1.5;
}

.auth-info {
  margin-bottom: 1rem;
}

.auth-guide {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
  padding: 1.5rem;
  background: color-mix(in srgb, var(--sakai-primary) 6%, transparent);
  border-radius: var(--sakai-border-radius-lg);
  border: 0.0625rem solid color-mix(in srgb, var(--sakai-border-color) 80%, transparent);
}

.auth-guide h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
}

.auth-guide__intro,
.auth-guide__hint {
  margin: 0;
  color: var(--sakai-text-color-tertiary);
  line-height: 1.5;
}

.auth-guide__steps {
  margin: 0;
  padding-left: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
  color: var(--sakai-text-color-secondary);
}

.auth-guide__step {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-2);
}

.auth-guide__step-title {
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
}

.auth-guide__link {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-2);
  color: var(--sakai-text-color-secondary);
}

.auth-guide__code {
  align-self: flex-start;
  font-family: var(--sakai-font-family-mono, 'SFMono-Regular', ui-monospace, 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', monospace);
  font-size: 0.9rem;
  padding: 0.375rem 0.75rem;
  border-radius: var(--sakai-border-radius-sm);
  background: var(--sakai-surface-alt);
  border: 0.0625rem solid color-mix(in srgb, var(--sakai-border-color) 85%, transparent);
  color: var(--sakai-text-color-secondary);
}
</style>

