<template>
  <ThemePage>
    <section class="auth-page sign-in">
      <div class="auth-card">
        <header class="auth-card__header">
          <div class="auth-card__icon">
            <UiIcon name="LockOutlined" :size="28" />
          </div>
          <div>
            <h2>{{ title }}</h2>
            <p>{{ subtitle }}</p>
          </div>
        </header>
        <div v-if="loading" class="auth-loading">
          <span class="loader"></span>
        </div>
        <div v-else>
          <div v-if="tokenError" class="auth-error">{{ tokenError }}</div>
          <div v-else-if="completed" class="auth-success">
            <p>{{ t('auth.resetPassword.success') }}</p>
            <RouterLink class="auth-submit" :to="loginRoute">{{ loginLabel }}</RouterLink>
          </div>
          <form v-else class="auth-form" @submit.prevent="submit">
            <label class="auth-field">
              <span>{{ t('auth.resetPassword.passwordLabel') }}</span>
              <div class="auth-input">
                <UiIcon name="LockOutlined" :size="18" />
                <input v-model="password" type="password" required autocomplete="new-password" />
              </div>
            </label>
            <label class="auth-field">
              <span>{{ t('auth.resetPassword.confirmLabel') }}</span>
              <div class="auth-input">
                <UiIcon name="LockOutlined" :size="18" />
                <input v-model="confirmPassword" type="password" required autocomplete="new-password" />
              </div>
            </label>
            <p class="auth-hint">{{ t('auth.resetPassword.requirements') }}</p>
            <p v-if="mismatch" class="auth-error">{{ t('auth.resetPassword.mismatch') }}</p>
            <p v-if="error" class="auth-error">{{ error }}</p>
            <button class="auth-submit" type="submit" :disabled="submitting || mismatch">
              <span v-if="submitting" class="loader"></span>
              <span>{{ submitting ? t('common.loading') : t('auth.resetPassword.submit') }}</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { isAxiosError } from 'axios';
import ThemePage from '@/layout/theme/ThemePage.vue';
import UiIcon from '@/components/ui/UiIcon.vue';
import {
  completePasswordReset,
  fetchPasswordResetToken,
  type PasswordResetRole,
  type PasswordResetTokenInfo
} from '@/services/passwordReset';

const route = useRoute();
const { t } = useI18n();

const token = computed(() => (Array.isArray(route.params.token) ? route.params.token[0] : route.params.token) || '');
const hintedRole = computed<PasswordResetRole | null>(() => {
  const roleQuery = Array.isArray(route.query.role) ? route.query.role[0] : route.query.role;
  if (roleQuery === 'TEACHER' || roleQuery === 'TEACHER_ASSISTANT' || roleQuery === 'STUDENT') {
    return roleQuery;
  }
  return null;
});

const loading = ref(true);
const submitting = ref(false);
const completed = ref(false);
const error = ref('');
const tokenError = ref('');
const password = ref('');
const confirmPassword = ref('');
const tokenInfo = ref<PasswordResetTokenInfo | null>(null);

const resolvedRole = computed<PasswordResetRole | null>(() => tokenInfo.value?.role || hintedRole.value);

const title = computed(() => t('auth.resetPassword.title'));

const subtitle = computed(() => {
  if (tokenError.value) {
    return '';
  }
  if (tokenInfo.value?.email) {
    return t('auth.resetPassword.description', { email: tokenInfo.value.email });
  }
  return t('auth.resetPassword.instructions');
});

const mismatch = computed(() => password.value !== confirmPassword.value);

const loginRoute = computed(() => {
  const role = resolvedRole.value;
  if (role === 'TEACHER') {
    return { name: 'login-teacher' };
  }
  if (role === 'TEACHER_ASSISTANT') {
    return { name: 'assistant-login' };
  }
  return { name: 'login-student-fallback' };
});

const loginLabel = computed(() => {
  const role = resolvedRole.value;
  if (role === 'TEACHER') {
    return t('teacher.login');
  }
  if (role === 'TEACHER_ASSISTANT') {
    return t('assistant.login');
  }
  return t('student.loginTitle');
});

onMounted(async () => {
  if (!token.value) {
    tokenError.value = t('auth.resetPassword.tokenInvalid');
    loading.value = false;
    return;
  }
  try {
    const { data } = await fetchPasswordResetToken(token.value);
    tokenInfo.value = data;
  } catch (err) {
    console.error('Failed to load reset token', err);
    if (isAxiosError(err) && err.response?.status === 410) {
      tokenError.value = t('auth.resetPassword.tokenExpired');
    } else {
      tokenError.value = t('auth.resetPassword.tokenInvalid');
    }
  } finally {
    loading.value = false;
  }
});

const submit = async () => {
  if (mismatch.value) {
    return;
  }
  submitting.value = true;
  error.value = '';
  try {
    await completePasswordReset({ token: token.value as string, password: password.value });
    completed.value = true;
  } catch (err) {
    console.error('Password reset failed', err);
    if (isAxiosError(err) && err.response?.status === 410) {
      error.value = t('auth.resetPassword.tokenExpired');
    } else {
      error.value = t('auth.resetPassword.error');
    }
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.auth-loading {
  display: flex;
  justify-content: center;
  padding: 2rem 0;
}

.auth-success {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  color: var(--sakai-success-color);
}

.auth-success .auth-submit {
  text-align: center;
}

.auth-hint {
  margin: 0 0 1rem;
  color: var(--sakai-text-color-secondary);
}
</style>

