<template>
  <div class="container py-12 text-center">
    <h1>{{ t('teacher.planUpgradePaypalCancelled') }}</h1>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useToast } from '@/composables/useToast';

const router = useRouter();
const { t } = useI18n();
const toast = useToast();

onMounted(() => {
  toast.warning({ detail: t('teacher.planUpgradePaypalCancelled') });
  router.replace({ name: 'teacher-plan-upgrade' }).catch(() => {});
});
</script>
