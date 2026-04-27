<template>
  <ThemePage>
    <section class="auth-page sign-in">
      <div class="auth-card">
        <header class="auth-card__header">
          <div class="auth-card__icon">
            <UiIcon name="MailOutlined" :size="28" />
          </div>
          <div>
            <h2>{{ title }}</h2>
            <p>{{ description }}</p>
          </div>
        </header>
        <template v-if="success">
          <div class="auth-success-state">
            <div class="auth-success-state__icon">
              <UiIcon name="MailOutlined" :size="40" />
            </div>
            <h3 class="auth-success-state__title">{{ t('auth.forgotPassword.emailSentTitle') }}</h3>
            <p class="auth-success-state__message">{{ successMessage }}</p>
            <p class="auth-success-state__hint">{{ t('auth.forgotPassword.checkEmail') }}</p>
            <RouterLink :to="backToLogin" class="auth-success-state__link">
              {{ backToLoginLabel }}
            </RouterLink>
          </div>
        </template>
        <template v-else>
          <form class="auth-form" @submit.prevent="submit">
            <label class="auth-field">
              <span>{{ t('auth.forgotPassword.emailLabel') }}</span>
              <div class="auth-input">
                <UiIcon name="MailOutlined" :size="18" />
                <input v-model="email" type="email" required autocomplete="email" />
              </div>
            </label>
            <p v-if="error" class="auth-error">{{ error }}</p>
            <button class="auth-submit" type="submit" :disabled="submitting">
              <span v-if="submitting" class="loader"></span>
              <span>{{ submitting ? t('common.loading') : t('auth.forgotPassword.submit') }}</span>
            </button>
          </form>
          <div class="auth-links">
            <RouterLink :to="backToLogin">{{ backToLoginLabel }}</RouterLink>
          </div>
        </template>
      </div>
    </section>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { isAxiosError } from 'axios';
import ThemePage from '@/layout/theme/ThemePage.vue';
import UiIcon from '@/components/ui/UiIcon.vue';
import { requestPasswordReset, type PasswordResetRole } from '@/services/passwordReset';

const route = useRoute();
const { t } = useI18n();

const submitting = ref(false);
const success = ref(false);
const error = ref('');
const email = ref('');

const role = computed<PasswordResetRole>(() => {
  const metaRole = route.meta.authRole;
  if (metaRole === 'TEACHER') return 'TEACHER';
  if (metaRole === 'TEACHER_ASSISTANT') return 'TEACHER_ASSISTANT';
  return 'STUDENT';
});

const tenantFromRoute = computed(() => {
  const tenantQuery = Array.isArray(route.query.tenant) ? route.query.tenant[0] : route.query.tenant;
  if (typeof tenantQuery === 'string' && tenantQuery.trim()) {
    return tenantQuery.trim();
  }
  const tenantParam = Array.isArray(route.params.tenant) ? route.params.tenant[0] : route.params.tenant;
  return typeof tenantParam === 'string' ? tenantParam.trim() : '';
});

const backToLogin = computed(() => {
  const tenant = tenantFromRoute.value;
  if (role.value === 'TEACHER') {
    const location: Record<string, unknown> = { name: 'login-teacher' };
    if (tenant) {
      location.query = { tenant };
    }
    return location;
  }
  if (role.value === 'TEACHER_ASSISTANT') {
    const location: Record<string, unknown> = { name: 'assistant-login' };
    if (tenant) {
      location.query = { tenant };
    }
    return location;
  }
    return tenant
      ? { name: 'login-student', params: { tenant } }
      : { name: 'login-student-fallback' };
});

const backToLoginLabel = computed(() => {
  if (role.value === 'TEACHER') {
    return t('teacher.login');
  }
  if (role.value === 'TEACHER_ASSISTANT') {
    return t('assistant.login');
  }
  return t('student.loginTitle');
});

const title = computed(() => {
  if (role.value === 'TEACHER') {
    return t('auth.forgotPassword.teacherTitle');
  }
  if (role.value === 'TEACHER_ASSISTANT') {
    return t('auth.forgotPassword.assistantTitle');
  }
  return t('auth.forgotPassword.studentTitle');
});

const description = computed(() => {
  if (role.value === 'TEACHER') {
    return t('auth.forgotPassword.teacherDescription');
  }
  if (role.value === 'TEACHER_ASSISTANT') {
    return t('auth.forgotPassword.assistantDescription');
  }
  return t('auth.forgotPassword.studentDescription');
});

const successMessage = computed(() => {
  const trimmed = email.value.trim();
  return t('auth.forgotPassword.success', { email: trimmed || email.value });
});

const submit = async () => {
  submitting.value = true;
  success.value = false;
  error.value = '';
  try {
    await requestPasswordReset({ email: email.value, role: role.value });
    success.value = true;
  } catch (err) {
    console.error('Password reset request failed', err);
    if (isAxiosError(err)) {
      const status = err.response?.status;
      if (status === 429) {
        error.value = t('auth.forgotPassword.rateLimited');
      } else if (status === 404) {
        error.value = t('auth.forgotPassword.notFound');
      } else {
        error.value = t('auth.forgotPassword.error');
      }
    } else {
      error.value = t('auth.forgotPassword.error');
    }
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.auth-success-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
}

.auth-success-state__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background-color: var(--sakai-primary-100, rgba(64, 120, 255, 0.1));
  color: var(--sakai-primary-color);
}

.auth-success-state__title {
  margin: 0;
  font-size: 1.375rem;
  font-weight: 600;
}

.auth-success-state__message {
  margin: 0;
  color: var(--sakai-success-color);
  font-weight: 500;
}

.auth-success-state__hint {
  margin: 0;
  color: var(--sakai-text-color-secondary);
}

.auth-success-state__link {
  margin-top: 0.5rem;
  font-weight: 600;
  color: var(--sakai-primary-color);
}

.auth-success-state__link:hover {
  text-decoration: underline;
}
</style>

