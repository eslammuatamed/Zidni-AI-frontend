<template>
  <ThemePage>
    <section class="auth-page sign-in">
      <div class="auth-card">
        <header class="auth-card__header">
          <div class="auth-card__icon">
            <UiIcon name="SafetyCertificateOutlined" :size="28" />
          </div>
          <div>
            <h2>{{ t('platform.loginTitle') }}</h2>
            <p>{{ t('platform.loginSubtitle') }}</p>
          </div>
        </header>
        <form class="auth-form" @submit.prevent="submit">
          <label class="auth-field">
            <span>{{ t('platform.email') }}</span>
            <div class="auth-input">
              <UiIcon name="MailOutlined" :size="18" />
              <input v-model="form.email" type="email" autocomplete="username" required />
            </div>
          </label>
          <label class="auth-field">
            <span>{{ t('platform.password') }}</span>
            <div class="auth-input">
              <UiIcon name="LockOutlined" :size="18" />
              <input v-model="form.password" type="password" autocomplete="current-password" required />
            </div>
          </label>
          <p v-if="errorMessage" class="auth-error">{{ errorMessage }}</p>
          <button class="auth-submit" type="submit" :disabled="loading">
            <span v-if="loading" class="loader"></span>
            <span>{{ loading ? t('common.loading') : t('platform.submit') }}</span>
          </button>
        </form>
      </div>
    </section>
  </ThemePage>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { RouteLocationRaw } from 'vue-router';
import { useI18n } from 'vue-i18n';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import { safeRedirect } from '@/lib/safeRedirect';
import { handleApiError } from '@/composables/useApiError';
import UiIcon from '@/components/ui/UiIcon.vue';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const auth = useAuthStore();

const form = reactive({
  email: '',
  password: ''
});

const loading = ref(false);
const errorMessage = ref('');

const adminHomePath = '/admin/home';

const fallbackRoute = router.resolve({ name: 'admin-console' });
const fallbackPath = fallbackRoute?.path || adminHomePath;
const redirectTarget = ref(fallbackPath);
let redirectCaptured = false;

const sanitizeRedirect = (value: string | null | undefined): string => {
  const candidate = safeRedirect(typeof value === 'string' ? value : '', fallbackPath);
  return candidate.startsWith('/admin') ? candidate : fallbackPath;
};

const consumeRedirect = () => {
  if (redirectCaptured) {
    return;
  }
  redirectCaptured = true;
  const nextRaw = route.query.next;
  const redirectRaw = route.query.redirect;
  const value = Array.isArray(nextRaw)
    ? nextRaw[0]
    : typeof nextRaw === 'string'
      ? nextRaw
      : Array.isArray(redirectRaw)
        ? redirectRaw[0]
        : redirectRaw;
  redirectTarget.value = sanitizeRedirect(typeof value === 'string' ? value : '');
  if (value) {
    const nextQuery = { ...route.query };
    delete nextQuery.redirect;
    delete nextQuery.next;
    router
      .replace({
        name: route.name as string,
        params: route.params,
        query: nextQuery,
        hash: route.hash
      })
      .catch((navigationError) => {
        console.warn('Failed to clear admin login redirect query', navigationError);
      });
  }
};

consumeRedirect();

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

const submit = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    await api.post('/v1/auth/platform/login', {
      email: form.email,
      password: form.password
    });
    await auth.me(true);
    const destination = redirectTarget.value || fallbackPath;
    await consumeRedirectQueryOnce();
    await router.replace(destination);
  } catch (e) {
    console.error('Admin login failed', e);
    errorMessage.value = handleApiError(e, {
      fallback: t('platform.loginError'),
      useToast: false
    });
  } finally {
    loading.value = false;
  }
};
</script>
