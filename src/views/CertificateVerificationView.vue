<template>
  <div class="certificate-verify">
    <div class="certificate-verify__card" :dir="isArabic ? 'rtl' : 'ltr'">
      <img class="certificate-verify__image" :src="certImage" alt="" aria-hidden="true" />
      <h1>{{ t('certificates.verify.title') }}</h1>
      <p class="certificate-verify__subtitle">{{ t('certificates.verify.subtitle') }}</p>

      <UiAlert v-if="loading" color="info" variant="soft">
        {{ t('certificates.verify.loading') }}
      </UiAlert>

      <UiAlert v-else-if="!data?.valid" color="danger" variant="soft">
        {{ t('certificates.verify.invalid') }}
      </UiAlert>

      <div v-else class="certificate-verify__details">
        <UiBadge color="success">{{ t('certificates.verify.valid') }}</UiBadge>
        <div class="certificate-verify__row">
          <span>{{ t('certificates.verify.student') }}</span>
          <strong>{{ data?.studentName }}</strong>
        </div>
        <div class="certificate-verify__row">
          <span>{{ t('certificates.verify.course') }}</span>
          <strong>{{ data?.courseName }}</strong>
        </div>
        <div class="certificate-verify__row">
          <span>{{ t('certificates.verify.teacher') }}</span>
          <strong>{{ data?.teacherName }}</strong>
        </div>
        <div class="certificate-verify__row">
          <span>{{ t('certificates.verify.date') }}</span>
          <strong>{{ formattedDate }}</strong>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiBadge from '@/components/ui/UiBadge.vue';
import { verifyCertificate, type CertificateVerificationResponse } from '@/services/certificates';
import certImage from '@/assets/cert.png';

const { t, locale } = useI18n();
const route = useRoute();

const loading = ref(true);
const data = ref<CertificateVerificationResponse | null>(null);
const isArabic = computed(() => String(locale.value || '').toLowerCase().startsWith('ar'));

const formattedDate = computed(() => {
  if (!data.value?.issuedAt) return '';
  try {
    const resolvedLocale = isArabic.value ? 'ar' : 'en';
    return new Intl.DateTimeFormat(resolvedLocale, { dateStyle: 'medium' }).format(new Date(data.value.issuedAt));
  } catch {
    return data.value.issuedAt || '';
  }
});

onMounted(async () => {
  const code = String(route.params.code || '').trim();
  if (!code) {
    data.value = { valid: false };
    loading.value = false;
    return;
  }
  try {
    data.value = await verifyCertificate(code);
  } catch (error) {
    console.error('[certificate] verify failed', error);
    data.value = { valid: false };
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.certificate-verify {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top, #f4f9fb, #ffffff 60%);
  padding: 2rem 1.5rem;
}

.certificate-verify__card {
  width: min(560px, 100%);
  background: white;
  border-radius: 1.25rem;
  padding: 2.5rem 2.25rem;
  box-shadow: 0 24px 45px rgba(15, 123, 138, 0.08);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.certificate-verify__image {
  width: 100%;
  max-height: 180px;
  object-fit: contain;
  border-radius: 0.75rem;
  background: #f6fafc;
}

.certificate-verify__card h1 {
  margin: 0;
  font-size: 2rem;
  color: #0f7b8a;
}

.certificate-verify__subtitle {
  margin: 0;
  color: #546e7a;
}

.certificate-verify__details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.certificate-verify__row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  color: #37474f;
}

.certificate-verify__row span {
  color: #78909c;
}
</style>
