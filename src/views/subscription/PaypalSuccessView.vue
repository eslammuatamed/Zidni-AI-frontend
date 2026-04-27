<template>
  <div class="container py-12 text-center">
    <h1>{{ t('teacher.planUpgradePaypalProcessing') }}</h1>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import api from '@/services/api';
import { useToast } from '@/composables/useToast';
import { useFeaturesStore } from '@/stores/features';
import { useTeacherProfileStore } from '@/stores/teacherProfile';
import { useSubscriptionStore } from '@/stores/subscription';

const router = useRouter();
const { t } = useI18n();
const toast = useToast();
const featuresStore = useFeaturesStore();
const teacherProfileStore = useTeacherProfileStore();
const subscriptionStore = useSubscriptionStore();

let isRefreshingAfterPaypalSuccess = false;

const refreshAfterPaypalSuccess = async () => {
  if (isRefreshingAfterPaypalSuccess) {
    return;
  }
  isRefreshingAfterPaypalSuccess = true;
  try {
    await Promise.allSettled([
      (async () => {
        try {
          await featuresStore.refresh();
        } catch (error) {
          console.warn('[PaypalSuccessView] Failed to refresh feature flags after PayPal success', error);
        }
      })(),
      (async () => {
        try {
          await teacherProfileStore.load(true);
        } catch (error) {
          console.warn('[PaypalSuccessView] Failed to refresh teacher profile after PayPal success', error);
        }
      })()
    ]);
  } finally {
    isRefreshingAfterPaypalSuccess = false;
  }
};

onMounted(async () => {
  const token = new URLSearchParams(window.location.search).get('token');
  if (!token) {
    toast.warning({ detail: t('teacher.planUpgradePaypalMissingToken') });
    router.replace({ name: 'teacher-plan-upgrade' }).catch(() => {});
    return;
  }

  try {
    const { data } = await api.post('/api/payments/paypal/capture', null, { params: { token } });
    if (data?.captureStatus?.toUpperCase() === 'COMPLETED') {
      toast.success({ detail: t('teacher.planUpgradePaypalSuccess') });
      await refreshAfterPaypalSuccess();
      await subscriptionStore.loadSubscription(true);
      subscriptionStore.startTemporaryPolling();
    } else {
      toast.error({ detail: t('teacher.planUpgradePaypalIncomplete') });
    }
  } catch (error) {
    toast.error({ detail: t('teacher.planUpgradePaypalError') });
  } finally {
    router.replace({ name: 'teacher-plan-upgrade' }).catch(() => {});
  }
});
</script>
