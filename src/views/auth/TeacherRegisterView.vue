<template>
  <ThemePage>
    <section class="auth-page">
      <div class="auth-card">
        <header class="auth-card__header">
          <div class="auth-card__icon">
            <UiIcon name="SolutionOutlined" :size="28" />
          </div>
          <div>
            <h2>{{ t('teacher.registerTitle') }}</h2>
            <p>{{ t('teacher.registerSubtitle') }}</p>
          </div>
        </header>
        <form v-if="!success && registrationEnabled" class="auth-form" @submit.prevent="submit">
          <fieldset :disabled="loading || success">
            <label class="auth-field">
              <span>{{ t('teacher.name') }}</span>
              <div class="auth-input">
                <UiIcon name="UserOutlined" :size="18" />
                <input v-model="form.name" required autocomplete="organization" />
              </div>
            </label>
            <label class="auth-field">
              <span>{{ t('teacher.slug') }}</span>
              <div class="auth-input">
                <UiIcon name="LinkOutlined" :size="18" />
                <input
                  v-model="form.slug"
                  :title="t('teacher.slugInvalid')"
                />
              </div>
              <small>{{ t('teacher.slugHint') }}</small>
            </label>
            <label class="auth-field">
              <span>{{ t('teacher.subject') }}</span>
              <div class="auth-input">
                <UiIcon name="BookOutlined" :size="18" />
                <input v-model="form.subject" autocomplete="off" />
              </div>
            </label>
            <label class="auth-field">
              <span>{{ t('teacher.phone') }}</span>
              <div class="auth-phone">
                <div class="auth-phone__select">
                  <select v-model="form.phoneCountryCode" required>
                  <option v-for="option in phoneCountryOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </div>
              <div class="auth-phone__input">
                <input
                  v-model="form.phoneNumber"
                  required
                  inputmode="numeric"
                  maxlength="20"
                  :aria-invalid="Boolean(phoneError)"
                  placeholder="5551234567"
                />
              </div>
            </div>
              <small class="auth-phone__hint">{{ t('teacher.phoneHint') }}</small>
              <small v-if="phoneError" class="auth-phone__error">{{ phoneError }}</small>
            </label>
            <label class="auth-field">
              <span>{{ t('teacher.email') }}</span>
              <div class="auth-input">
                <UiIcon name="MailOutlined" :size="18" />
                <input
                v-model="form.email"
                type="email"
                required
                autocomplete="email"
                :aria-invalid="Boolean(emailError)"
              />
              </div>
              <small v-if="emailError" class="auth-field__error">{{ emailError }}</small>
            </label>
            <label class="auth-field">
              <span>{{ t('teacher.password') }}</span>
              <div class="auth-input">
                <UiIcon name="LockOutlined" :size="18" />
                <input
                  v-model="form.password"
                  type="password"
                  required
                  autocomplete="new-password"
                  :aria-invalid="Boolean(passwordError)"
                />
              </div>
              <small v-if="passwordError" class="auth-field__error">{{ passwordError }}</small>
            </label>
          </fieldset>
          <div class="auth-terms-accept">
            <UiCheckbox v-model="termsAccepted" :label="t('teacher.terms.acceptLabel')" />
            <button type="button" class="auth-terms-accept__link" @click="openTermsDialog">
              {{ t('teacher.terms.readAction') }}
            </button>
          </div>
          <small v-if="termsError" class="auth-terms-accept__error">{{ termsError }}</small>
          <UiAlert v-if="errorMessage" color="danger" variant="soft">
            {{ errorMessage }}
          </UiAlert>
          <button class="auth-submit" type="submit" :disabled="loading || success">
            <span v-if="loading" class="loader"></span>
            <span>{{ loading ? t('common.loading') : t('teacher.registerAction') }}</span>
          </button>
          <div v-if="whatsappHref" class="auth-manual__actions">
            <UiButton
              type="button"
              variant="link"
              color="secondary"
              prepend-icon="WhatsAppOutlined"
              @click="goToWhatsapp"
            >
              {{ t('teacher.registerManualCta') }}
            </UiButton>
          </div>
        </form>
        <section v-else-if="!success" class="auth-manual">
          <UiAlert color="info" variant="soft">
            <strong>{{ t('teacher.registerManualTitle') }}</strong>
            <p>{{ t('teacher.registerManualSubtitle') }}</p>
          </UiAlert>
          <div class="auth-manual__actions">
            <UiButton
              v-if="whatsappHref"
              color="primary"
              prepend-icon="WhatsAppOutlined"
              @click="goToWhatsapp"
            >
              {{ t('teacher.registerManualCta') }}
            </UiButton>
            <p v-else class="auth-manual__fallback">{{ t('teacher.registerManualNoWhatsapp') }}</p>
          </div>
        </section>
        <section v-else class="auth-success">
          <UiAlert color="success" variant="soft" class="auth-success__notice">
            <strong>{{ t('teacher.registerSuccessTitle') }}</strong>
            <p>{{ t('teacher.registerSuccessMessage') }}</p>
          </UiAlert>
          <div class="auth-success__actions">
            <button type="button" class="auth-submit auth-success__cta" @click="goToLogin">
              {{ t('teacher.registerSuccessCta') }}
            </button>
          </div>
          <section class="auth-terms" aria-labelledby="teacher-terms-title">
            <div class="auth-terms__header">
              <h3 id="teacher-terms-title">{{ t('teacher.terms.title') }}</h3>
              <UiButton variant="outline" color="primary" @click="openTermsDialog">
                {{ t('teacher.terms.readAction') }}
              </UiButton>
            </div>
            <p class="auth-terms__welcome">{{ t('teacher.terms.welcome') }}</p>
            <p class="auth-terms__intro">{{ t('teacher.terms.intro') }}</p>
            <div class="auth-terms__sections">
              <article
                v-for="(section, index) in termsSections"
                :key="section.title || index"
                class="auth-terms__section"
              >
                <h4>{{ section.title }}</h4>
                <p v-if="section.body">{{ section.body }}</p>
                <ul v-if="section.items?.length">
                  <li v-for="(item, itemIndex) in section.items" :key="itemIndex">{{ item }}</li>
                </ul>
              </article>
            </div>
            <p class="auth-terms__closing">{{ t('teacher.terms.closing') }}</p>
          </section>
        </section>
      
        <div class="auth-links">
          <RouterLink :to="teacherLoginRoute">{{ t('teacher.haveAccount') }}</RouterLink>
         </div>
      </div>
    </section>
    <UiDialog v-model="termsDialog" :title="t('teacher.terms.title')" width="760px">
      <div class="terms-dialog">
        <section
          v-for="block in bilingualTerms"
          :key="block.locale"
          class="terms-dialog__locale"
          :dir="block.dir"
        >
          <header class="terms-dialog__locale-header">
            <span class="terms-dialog__locale-label">{{ block.label }}</span>
            <strong class="terms-dialog__locale-title">{{ block.content.title }}</strong>
          </header>
          <p class="terms-dialog__welcome">{{ block.content.welcome }}</p>
          <p class="terms-dialog__intro">{{ block.content.intro }}</p>
          <div class="terms-dialog__sections">
            <article
              v-for="(section, index) in block.content.sections"
              :key="section.title || index"
              class="terms-dialog__section"
            >
              <h4>{{ section.title }}</h4>
              <p v-if="section.body">{{ section.body }}</p>
              <ul v-if="section.items?.length">
                <li v-for="(item, itemIndex) in section.items" :key="itemIndex">{{ item }}</li>
              </ul>
            </article>
          </div>
          <p class="terms-dialog__closing">{{ block.content.closing }}</p>
        </section>
      </div>
      <template #footer>
        <UiButton variant="outline" color="secondary" @click="termsDialog = false">
          {{ t('common.close') }}
        </UiButton>
        <UiButton color="primary" @click="acceptTerms">
          {{ t('teacher.terms.acceptAction') }}
        </UiButton>
      </template>
    </UiDialog>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import type { RouteLocationRaw } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { isAxiosError } from 'axios';
import UiIcon from '@/components/ui/UiIcon.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiCheckbox from '@/components/ui/UiCheckbox.vue';
import UiDialog from '@/components/ui/UiDialog.vue';
import { registerTeacher } from '@/services/teacher';
import { useTenantStore } from '@/stores/tenant';
import { PHONE_COUNTRY_CODES } from '@/constants/countryCodes';
import { normalizePhoneInput, PhoneNumberValidationError } from '@/utils/phoneNumber';
import { isValidEmail } from '@/utils/validation';
import { getTeacherRegistrationSettings, type TeacherRegistrationSettings } from '@/api/registration';
import i18n from '@/plugins/i18n';

const { t, tm } = useI18n();
const tenantStore = useTenantStore();
const router = useRouter();

const MIN_PASSWORD_LENGTH = 8;

const form = reactive({
  name: '',
  slug: '',
  subject: '',
  phoneCountryCode: '+1',
  phoneNumber: '',
  email: '',
  password: ''
});

const teacherLoginRoute = computed(() => ({ name: 'login-teacher' }));

const slugExample = computed(() => {
  const slugFromForm = (form.slug || '').trim().toLowerCase();
  if (slugFromForm) {
    return slugFromForm;
  }
  const slugFromTenant = (tenantStore.slug || '').trim().toLowerCase();
  if (slugFromTenant) {
    return slugFromTenant;
  }
  const fallback = (import.meta.env.VITE_TENANT_SLUG || '').trim().toLowerCase();
  return fallback || 'my-academy';
});

const canonicalLoginPath = '/teacher/login';
const loginLink = computed(() => {
  const slug = slugExample.value;
  if (!slug) {
    return canonicalLoginPath;
  }
  if (import.meta.env.PROD) {
    return `https://${slug}.zidni.cloud${canonicalLoginPath}`;
  }
  const base = (import.meta.env.VITE_DEV_DOMAIN_BASE || '127.0.0.1.nip.io').trim().replace(/^\.+|\.+$/g, '');
  return `http://${slug}.${base}:5173${canonicalLoginPath}`;
});
const phoneCountryOptions = computed(() =>
  PHONE_COUNTRY_CODES.map((option) => ({
    value: option.value,
    label: `${option.value} · ${t(option.nameKey)}`
  }))
);

const loading = ref(false);
const errorMessage = ref('');
const phoneError = ref('');
const emailError = ref('');
const passwordError = ref('');
const termsError = ref('');
const termsDialog = ref(false);
const termsAccepted = ref(false);
const success = ref(false);
const postRegisterRoute = ref<RouteLocationRaw | null>(null);
const registeredTenantSlug = ref('');
const verifyLink = computed(() => ({ name: 'teacher-verify' }));
const termsSections = computed(() => tm('teacher.terms.sections') as TermsSection[]);
const registrationSettings = ref<TeacherRegistrationSettings | null>(null);
const registrationEnabled = computed(() => registrationSettings.value?.enabled ?? false);
const whatsappHref = computed(() => {
  const raw = registrationSettings.value?.whatsappNumber ?? '';
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) {
    return '';
  }
  const message = t('teacher.registerManualMessage');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
});

type TermsSection = {
  title: string;
  body?: string;
  items?: string[];
};

type TermsContent = {
  title: string;
  welcome: string;
  intro: string;
  sections: TermsSection[];
  closing: string;
};

const getTermsContent = (locale: 'en' | 'ar'): TermsContent => {
  const messages = i18n.global.getLocaleMessage(locale) as Record<string, any>;
  const terms = messages?.teacher?.terms as TermsContent | undefined;
  if (terms?.sections?.length) {
    return terms;
  }
  const fallback = i18n.global.getLocaleMessage('en') as Record<string, any>;
  return (fallback?.teacher?.terms as TermsContent) || {
    title: '',
    welcome: '',
    intro: '',
    sections: [],
    closing: ''
  };
};

const bilingualTerms = computed(() => [
  {
    locale: 'ar',
    label: t('languageArabic'),
    dir: 'rtl',
    content: getTermsContent('ar')
  },
  {
    locale: 'en',
    label: t('languageEnglish'),
    dir: 'ltr',
    content: getTermsContent('en')
  }
]);

const openTermsDialog = () => {
  termsDialog.value = true;
};

const acceptTerms = () => {
  termsAccepted.value = true;
  termsError.value = '';
  termsDialog.value = false;
};

const slugify = (value: string) => (value || '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9-]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 50);

watch(() => form.name, (newValue) => {
  if (!form.slug) {
    form.slug = slugify(newValue);
  }
});

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

watch(
  () => termsAccepted.value,
  (value) => {
    if (value) {
      termsError.value = '';
    }
  }
);

watch(() => form.slug, (slug) => {
  const normalized = slugify(slug);
  if (normalized !== slug) {
    form.slug = normalized;
  }
});

const submit = async () => {
  if (success.value) {
    return;
  }
  if (!termsAccepted.value) {
    termsError.value = t('teacher.terms.acceptRequired');
    return;
  }
  loading.value = true;
  errorMessage.value = '';
  phoneError.value = '';
  passwordError.value = '';
  termsError.value = '';
  const trimmedEmail = form.email.trim();
  if (!isValidEmail(trimmedEmail)) {
    emailError.value = t('teacher.emailInvalid');
    loading.value = false;
    return;
  }
  form.email = trimmedEmail;
  emailError.value = '';
  if (form.password.length < MIN_PASSWORD_LENGTH) {
    passwordError.value = t('auth.passwordMinLength', { count: MIN_PASSWORD_LENGTH });
    loading.value = false;
    return;
  }
  try {
    const normalizedPhone = normalizePhoneInput(form.phoneCountryCode, form.phoneNumber);
    form.phoneCountryCode = normalizedPhone.phoneCountryCode;
    form.phoneNumber = normalizedPhone.phoneNumber;
    form.slug = slugify(form.slug);
    const response = await registerTeacher({
      name: form.name,
      slug: form.slug || undefined,
      subject: form.subject || undefined,
      plan: 'free',
      phoneCountryCode: normalizedPhone.phoneCountryCode,
      phoneNumber: normalizedPhone.phoneNumber,
      email: form.email,
      password: form.password
    });
    const loginSlug = (response.slug || form.slug || '').trim().toLowerCase();
    registeredTenantSlug.value = loginSlug;
    const query: Record<string, string> = { registered: 'teacher' };
    if (loginSlug) {
      query.tenant = loginSlug;
    }
    postRegisterRoute.value = { name: 'login-teacher', query };
    success.value = true;
    return;
  } catch (err) {
    console.error('Teacher registration failed', err);
    if (err instanceof PhoneNumberValidationError) {
      phoneError.value = t('teacher.phoneInvalid');
    } else {
      errorMessage.value = resolveTeacherRegisterError(err);
    }
  } finally {
    loading.value = false;
  }
};

const resolveTeacherRegisterError = (err: unknown): string => {
  const defaultMessage = t('teacher.registerError');
  if (isAxiosError(err)) {
    const serverMessage = String(err.response?.data?.message ?? '').trim();
    if (!serverMessage) {
      return defaultMessage;
    }
    const normalized = serverMessage.toLowerCase();
    const emailInUseMessages = new Set([
      'this email is already linked to a student account. if it belongs to you, please sign in or use forgot password to reset your access.',
      'this email is already in use. if it belongs to you, please sign in or use forgot password to reset your access.'
    ]);
    if (emailInUseMessages.has(normalized)) {
      return t('teacher.registerEmailInUse');
    }
    return serverMessage;
  }
  return defaultMessage;
};

const goToLogin = () => {
  const slug = registeredTenantSlug.value.trim();
  const target =
    postRegisterRoute.value ||
    (slug
      ? { name: 'login-teacher', query: { tenant: slug } }
      : teacherLoginRoute.value);
  router.push(target).catch((navigationError) => {
    console.warn('Failed to navigate to teacher login', navigationError);
  });
};

const goToWhatsapp = () => {
  if (!whatsappHref.value) {
    return;
  }
  window.location.href = whatsappHref.value;
};

onMounted(async () => {
  try {
    const settings = await getTeacherRegistrationSettings();
    registrationSettings.value = { enabled: false, whatsappNumber: settings.whatsappNumber };
    if (whatsappHref.value) {
      window.location.href = whatsappHref.value;
    }
  } catch (error) {
    console.warn('[TeacherRegisterView] failed to load registration settings', error);
    registrationSettings.value = { enabled: false, whatsappNumber: null };
  }
});
</script>

<style scoped>
.slug-status {
  margin-top: 0.5rem;
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

.auth-phone {
  display: flex;
  gap: var(--sakai-space-2);
  align-items: center;
}

.auth-phone__select {
  flex: 0 0 8rem;
}

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

.auth-phone__input {
  flex: 1;
}

.auth-phone__hint {
  display: block;
  margin-top: 0.375rem;
  color: var(--sakai-text-color-tertiary);
}

.auth-phone__error {
  display: block;
  margin-top: 0.375rem;
  color: var(--sakai-danger-500);
  font-weight: var(--sakai-font-weight-medium);
}

.auth-success {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: stretch;
}

.auth-success__notice {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: center;
}

.auth-success__notice strong {
  font-size: 1.125rem;
}

.auth-success__notice p {
  margin: 0;
}

.auth-success__actions {
  display: flex;
  justify-content: center;
}

.auth-success__cta {
  width: 100%;
}

.auth-manual {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.auth-manual :deep(.ui-alert) {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.auth-manual__actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.auth-manual__fallback {
  margin: 0;
  color: var(--sakai-text-color-tertiary);
}

.auth-terms-accept {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-3);
  padding: 0.75rem 0.95rem;
  border-radius: var(--sakai-border-radius-md);
  border: 0.0625rem solid color-mix(in srgb, var(--sakai-border-color) 80%, transparent);
  background: color-mix(in srgb, var(--sakai-surface) 92%, transparent);
}

.auth-terms-accept__link {
  border: none;
  background: transparent;
  color: var(--sakai-primary);
  font-weight: var(--sakai-font-weight-medium);
  cursor: pointer;
  padding: 0.25rem 0.5rem;
}

.auth-terms-accept__link:hover {
  text-decoration: underline;
}

.auth-terms-accept__error {
  display: block;
  margin-top: 0.35rem;
  color: var(--sakai-danger-500);
  font-weight: var(--sakai-font-weight-medium);
}

.auth-terms {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--sakai-surface);
  border-radius: var(--sakai-border-radius-lg);
  border: 0.0625rem solid color-mix(in srgb, var(--sakai-border-color) 80%, transparent);
}

.auth-terms__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-3);
}

.auth-terms h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.auth-terms__welcome,
.auth-terms__intro,
.auth-terms__closing {
  margin: 0;
  color: var(--sakai-text-color-secondary);
  line-height: 1.6;
}

.auth-terms__sections {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.auth-terms__section h4 {
  margin: 0 0 0.35rem;
  font-size: 1rem;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
}

.auth-terms__section p {
  margin: 0 0 0.5rem;
  color: var(--sakai-text-color-secondary);
  line-height: 1.6;
}

.auth-terms__section ul {
  margin: 0;
  padding-left: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  color: var(--sakai-text-color-secondary);
}

.terms-dialog {
  display: grid;
  gap: var(--sakai-space-5);
}

.terms-dialog__locale {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
  padding: 1.25rem;
  border-radius: var(--sakai-border-radius-lg);
  border: 0.0625rem solid color-mix(in srgb, var(--sakai-border-color) 80%, transparent);
  background: var(--sakai-surface);
}

.terms-dialog__locale-header {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.terms-dialog__locale-label {
  font-size: 0.85rem;
  color: var(--sakai-text-color-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.terms-dialog__locale-title {
  font-size: 1rem;
  color: var(--sakai-text-color);
}

.terms-dialog__welcome,
.terms-dialog__intro,
.terms-dialog__closing {
  margin: 0;
  color: var(--sakai-text-color-secondary);
  line-height: 1.6;
}

.terms-dialog__sections {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
}

.terms-dialog__section h4 {
  margin: 0 0 0.35rem;
  font-size: 0.95rem;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
}

.terms-dialog__section p {
  margin: 0 0 0.5rem;
  color: var(--sakai-text-color-secondary);
  line-height: 1.6;
}

.terms-dialog__section ul {
  margin: 0;
  padding-left: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  color: var(--sakai-text-color-secondary);
}
</style>

