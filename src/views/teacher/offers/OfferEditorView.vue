<template>
  <ThemePage :title="pageTitle" :subtitle="pageSubtitle">
    <template #actions>
      <UiButton variant="link" color="secondary" prepend-icon="ArrowLeftOutlined" @click="goBack">
        {{ t('offers.backToList') }}
      </UiButton>
    </template>

    <UiAlert v-if="!offersEnabled" color="warning" variant="soft" class="offer-editor__alert">
      {{ t('offers.disabled') }}
    </UiAlert>

    <div v-else class="offer-editor__content">
      <UiAlert v-if="errorMessage" color="danger" variant="soft" class="offer-editor__error">
        {{ errorMessage }}
      </UiAlert>

      <UiSkeleton v-if="loading" height="360px" animation="wave" />

      <OfferForm
        v-else-if="!errorMessage"
        :mode="mode"
        :offer="store.current"
        :courses="courseOptions"
        :submitting="saving"
        @cancel="goBack"
        @submit="handleSubmit"
      />
    </div>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import ThemePage from '@/layout/theme/ThemePage.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiSkeleton from '@/components/ui/UiSkeleton.vue';
import OfferForm from './OfferForm.vue';
import { useOffersStore } from '@/stores/offers';
import { useCoursesStore } from '@/stores/courses';
import { useToast } from '@/composables/useToast';
import type { OfferPayload } from '@/api/offers';
import { useFeaturesStore } from '@/stores/features';
import { FEATURE } from '@/constants/featureCatalog';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const toast = useToast();
const store = useOffersStore();
const coursesStore = useCoursesStore();
const features = useFeaturesStore();
const offersEnabled = computed(() => features.hasFeature(FEATURE.offers));

const loading = ref(true);
const saving = ref(false);
const errorMessage = ref('');

const mode = computed<'create' | 'edit'>(() =>
  route.name === 'teacher-offers-edit' ? 'edit' : 'create'
);

const offerId = computed(() => {
  const raw = route.params.id;
  const parsed = typeof raw === 'string' ? Number(raw) : Array.isArray(raw) ? Number(raw[0]) : NaN;
  return Number.isFinite(parsed) ? parsed : NaN;
});

const pageTitle = computed(() =>
  mode.value === 'edit' ? t('offers.editTitle') : t('offers.createTitle')
);

const pageSubtitle = computed(() => t('offers.subtitle'));

const courseOptions = computed(() => coursesStore.list);

const goBack = () => {
  router.push({ name: 'teacher-offers' });
};

const loadCourses = async () => {
  if (!coursesStore.list.length) {
    await coursesStore.fetchCourses();
  }
};

const initialize = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    await loadCourses();
    if (mode.value === 'edit') {
      if (!Number.isFinite(offerId.value)) {
        throw new Error(t('offers.loadFailed'));
      }
      store.clearCurrent();
      await store.load(offerId.value);
    } else {
      store.clearCurrent();
    }
  } catch (error) {
    const message =
      error instanceof Error && error.message ? error.message : t('offers.loadFailed');
    errorMessage.value = message;
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async (payload: OfferPayload & { code?: string }) => {
  saving.value = true;
  try {
    if (mode.value === 'edit' && Number.isFinite(offerId.value)) {
      await store.update(offerId.value, payload);
      toast.success(t('offers.updated'));
    } else if (payload.code) {
      await store.create({ ...payload, code: payload.code });
      toast.success(t('offers.created'));
    }
    await store.fetch({ page: 0 });
    goBack();
  } catch (error) {
    toast.error(t('offers.saveFailed'));
  } finally {
    saving.value = false;
  }
};

watch(
  () => route.fullPath,
  async () => {
    if (!offersEnabled.value) {
      return;
    }
    await initialize();
  }
);

watch(
  offersEnabled,
  async (enabled) => {
    if (enabled) {
      await initialize();
    } else {
      store.clearCurrent();
      loading.value = false;
    }
  }
);

onMounted(async () => {
  await features.ensureLoaded();
  if (offersEnabled.value) {
    await initialize();
  } else {
    loading.value = false;
  }
});
</script>

<style scoped>
.offer-editor__content {
  display: grid;
  gap: var(--sakai-space-6);
}

.offer-editor__alert {
  margin-bottom: var(--sakai-space-4);
}

.offer-editor__error {
  margin-bottom: var(--sakai-space-2);
}
</style>