<template>
  <ThemePage>
  <section class="auth-page">
    <div class="auth-card">
      <header class="auth-card__header">
        <div class="auth-card__icon">
          <UiIcon name="UserAddOutlined" :size="28" />
        </div>
        <div>
          <h2>{{ t('student.registerTitle') }}</h2>
          <p>{{ t('student.registerSubtitle') }}</p>
        </div>
      </header>
      <form v-if="!success" class="auth-form" @submit.prevent="submit">
        <fieldset :disabled="loading || success">
          <label class="auth-field">
            <span>{{ t('student.name') }}</span>
            <div class="auth-input">
              <UiIcon name="UserOutlined" :size="18" />
              <input v-model="form.name" required />
            </div>
          </label>
          <label class="auth-field">
            <span>{{ t('student.email') }}</span>
            <div class="auth-input">
              <UiIcon name="MailOutlined" :size="18" />
              <input
                v-model="form.email"
                type="email"
                required
                :aria-invalid="Boolean(emailError)"
              />
            </div>
            <small v-if="emailError" class="auth-field__error">{{ emailError }}</small>
          </label>
          <label class="auth-field">
            <span>{{ t('student.phone') }}</span>
            <div class="auth-phone flex gap-2 items-center">
              <div class="auth-phone__select basis-32 grow-0 shrink-0">
                <select v-model="form.phoneCountryCode" :aria-label="t('student.phoneCountryCode')">
                  <option v-for="option in phoneCountryOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </div>
              <div class="auth-phone__input flex-1">
                <input
                  v-model="form.phoneNumber"
                  inputmode="numeric"
                  maxlength="20"
                  :aria-label="t('student.phoneNumber')"
                  :aria-invalid="Boolean(phoneError)"
                  :placeholder="t('student.phonePlaceholder')"
                />
              </div>
            </div>
            <small class="auth-phone__hint block mt-[0.375rem] text-content-tertiary">{{ t('student.phoneHint') }}</small>
            <small v-if="phoneError" class="auth-phone__error">{{ phoneError }}</small>
          </label>
          <label class="auth-field">
            <span>{{ t('student.password') }}</span>
            <div class="auth-input">
              <UiIcon name="LockOutlined" :size="18" />
              <input v-model="form.password" type="password" required :aria-invalid="Boolean(passwordError)" />
            </div>
            <small v-if="passwordError" class="auth-field__error">{{ passwordError }}</small>
          </label>
        </fieldset>
        <UiAlert v-if="errorMessage" color="danger" variant="soft">
          {{ errorMessage }}
        </UiAlert>
        <button class="auth-submit" type="submit" :disabled="loading || success">
          <span v-if="loading" class="loader"></span>
          <span>{{ loading ? t('common.loading') : t('student.registerAction') }}</span>
        </button>
      </form>
      <section v-else class="auth-success flex flex-col gap-6 items-stretch">
        <UiAlert color="success" variant="soft" class="auth-success__notice flex flex-col gap-2 text-center">
          <strong>{{ t('student.registerSuccessTitle') }}</strong>
          <p>{{ t('student.registerSuccessMessage') }}</p>
        </UiAlert>
        <div class="auth-success__actions flex justify-center">
          <button type="button" class="auth-submit auth-success__cta w-full" @click="goToLogin">
            {{ t('student.registerSuccessCta') }}
          </button>
        </div>
      </section>
      <div class="auth-links">
        <RouterLink :to="loginLink">{{ t('student.haveAccount') }}</RouterLink>
      </div>
    </div>
  </section>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { RouteLocationRaw } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { isAxiosError } from 'axios';
import { registerStudent, type StudentRegistrationPayload } from '@/services/student';
import { useTenantStore } from '@/stores/tenant';
import { setStoredTenantSlug } from '@/utils/tenantStorage';
import { isValidEmail } from '@/utils/validation';
import UiIcon from '@/components/ui/UiIcon.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import { PHONE_COUNTRY_CODES } from '@/constants/countryCodes';
import { normalizePhoneInput, PhoneNumberValidationError } from '@/utils/phoneNumber';

const { t } = useI18n();
const tenantStore = useTenantStore();
const route = useRoute();
const router = useRouter();

const form = reactive({
  name: '',
  email: '',
  phoneCountryCode: '+1',
  phoneNumber: '',
  password: ''
});

const MIN_PASSWORD_LENGTH = 8;

const loading = ref(false);
const errorMessage = ref('');
const emailError = ref('');
const passwordError = ref('');
const success = ref(false);
const postRegisterRoute = ref<RouteLocationRaw | null>(null);
const phoneError = ref('');

const phoneCountryOptions = computed(() =>
  PHONE_COUNTRY_CODES.map((option) => ({
    value: option.value,
    label: `${option.value} · ${t(option.nameKey)}`
  }))
);

const tenant = computed(() => {
  const tenantParam = Array.isArray(route.query.tenant) ? route.query.tenant[0] : route.query.tenant;
  return typeof tenantParam === 'string' ? tenantParam.trim() : '';
});

const loginLink = computed(() => {
  const slug = tenant.value.trim();
  return slug
    ? { name: 'login-student', params: { tenant: slug } }
    : { name: 'login-student-fallback' };
});

const ensureBranding = async (tenant?: string) => {
  const slug = tenant?.trim();
  if (slug) {
    if (!tenantStore.branding || tenantStore.branding.slug !== slug) {
      await tenantStore.fetchBranding(slug);
    }
    return;
  }
  if (!tenantStore.branding) {
    await tenantStore.fetchBranding();
  }
};

const applyTenantFromRoute = async () => {
  if (!tenant.value) return false;
  setStoredTenantSlug(tenant.value);
  await ensureBranding(tenant.value);
  return true;
};

onMounted(async () => {
  const hasQueryTenant = await applyTenantFromRoute();
  if (!hasQueryTenant) {
    await ensureBranding();
  }
});

watch(
  () => route.query.tenant,
  () => {
    applyTenantFromRoute();
  }
);

watch(
  () => [form.phoneCountryCode, form.phoneNumber],
  () => {
    if (phoneError.value) {
      phoneError.value = '';
    }
    if (errorMessage.value) {
      errorMessage.value = '';
    }
  }
);

watch(
  () => form.email,
  () => {
    if (emailError.value) {
      emailError.value = '';
    }
    if (errorMessage.value) {
      errorMessage.value = '';
    }
  }
);

watch(
  () => form.password,
  () => {
    if (passwordError.value) {
      passwordError.value = '';
    }
    if (errorMessage.value) {
      errorMessage.value = '';
    }
  }
);

const submit = async () => {
  if (success.value) {
    return;
  }
  loading.value = true;
  errorMessage.value = '';
  phoneError.value = '';
  const trimmedEmail = form.email.trim();
  if (!isValidEmail(trimmedEmail)) {
    emailError.value = t('student.emailInvalid');
    loading.value = false;
    return;
  }
  form.email = trimmedEmail;
  emailError.value = '';
  const sanitizedDigits = form.phoneNumber.replace(/[^0-9]/g, '');
  let phoneValue: string | undefined;
  if (sanitizedDigits.length > 0) {
    try {
      const normalizedPhone = normalizePhoneInput(form.phoneCountryCode, form.phoneNumber);
      form.phoneCountryCode = normalizedPhone.phoneCountryCode;
      form.phoneNumber = normalizedPhone.phoneNumber;
      phoneValue = normalizedPhone.e164;
    } catch (err) {
      if (!(err instanceof PhoneNumberValidationError)) {
        console.error('Failed to normalize student phone number', err);
      }
      phoneError.value = t('student.phoneInvalid');
      loading.value = false;
      return;
    }
  }
  if (form.password.length < MIN_PASSWORD_LENGTH) {
    passwordError.value = t('auth.passwordMinLength', { count: MIN_PASSWORD_LENGTH });
    loading.value = false;
    return;
  }
  try {
    const payload: StudentRegistrationPayload = {
      name: form.name,
      email: form.email,
      password: form.password
    };
    if (phoneValue) {
      payload.phone = phoneValue;
    }
    const response = await registerStudent(payload);
    const slugCandidate = ((response.teacherSlug || tenant.value || '') as string).trim();
    if (slugCandidate) {
      setStoredTenantSlug(slugCandidate);
    }
    const query: Record<string, string> = { registered: 'student' };
    if (slugCandidate) {
      query.tenant = slugCandidate;
    }
    postRegisterRoute.value = slugCandidate
      ? { name: 'login-student', params: { tenant: slugCandidate }, query }
      : { name: 'login-student-fallback', query };
    success.value = true;
    return;
  } catch (err) {
    console.error('Failed to register student', err);
    errorMessage.value = resolveStudentRegisterError(err);
  } finally {
    loading.value = false;
  }
};

const resolveStudentRegisterError = (err: unknown): string => {
  const defaultMessage = t('student.registerError');
  if (isAxiosError(err)) {
    const serverMessage = String(err.response?.data?.message ?? '').trim();
    if (!serverMessage) {
      return defaultMessage;
    }
    const normalized = serverMessage.toLowerCase();
    const emailInUseMessages = new Set([
      'this email is already linked to a teacher account. if it belongs to you, please sign in or use forgot password to reset your access.',
      'this email is already in use. if it belongs to you, please sign in or use forgot password to reset your access.'
    ]);
    if (emailInUseMessages.has(normalized)) {
      return t('student.registerEmailInUse');
    }
    return serverMessage;
  }
  return defaultMessage;
};

const goToLogin = () => {
  const target = postRegisterRoute.value || loginLink.value;
  router.push(target).catch((navigationError) => {
    console.warn('Failed to navigate to student login', navigationError);
  });
};
</script>

<style scoped>
.auth-phone__select select,
.auth-phone__input input {
  width: 100%;
  padding: 0.625rem;
  border-radius: var(--sakai-border-radius-md);
  border: 0.0625rem solid color-mix(in srgb, var(--sakai-border-color) 80%, transparent);
  background: var(--sakai-surface);
  color: var(--sakai-text-color);
  font: inherit;
}

.auth-phone__error {
  display: block;
  margin-top: 0.375rem;
  color: var(--sakai-danger-500);
  font-weight: var(--sakai-font-weight-medium);
}

.auth-success__notice strong {
  font-size: 1.125rem;
}

.auth-success__notice p {
  margin: 0;
}
</style>

