<template>
  <div class="lab-category">
    <CategorySelector
      :categories="labStore.categories"
      :model-value="category"
      @update:model-value="navigateTo"
    />

    <section v-if="!categoryEnabled" class="lab-category__locked">
      <p>{{ t('labEnglish.errors.categoryDisabled') }}</p>
    </section>

    <section v-else>
      <header class="lab-category__header">
        <div>
          <h1>{{ labelFor(category) }}</h1>
          <p>{{ t('labEnglish.subtitles.categoryIntro', { category: labelFor(category) }) }}</p>
        </div>
        <ProgressBadge :mastered="mastered" :total="words.length" />
      </header>

      <VocabGrid :items="words" @spoken="handleSpoken" />

      <footer class="lab-category__footer">
        <RouterLink :to="quizRoute" class="lab-category__quiz">
          {{ t('labEnglish.buttons.quizCategory') }}
        </RouterLink>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import CategorySelector from '../components/CategorySelector.vue';
import VocabGrid from '../components/VocabGrid.vue';
import ProgressBadge from '../components/ProgressBadge.vue';
import { useEnglishLabStore } from '../store/englishLab.store';
import { useAuthStore } from '@/stores/auth';
import { useFeaturesStore } from '@/stores/features';
import { FEATURE } from '@/constants/featureCatalog';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const labStore = useEnglishLabStore();
const auth = useAuthStore();
const features = useFeaturesStore();

const category = computed(() => String(route.params.category || ''));
const labEnabled = computed(() => features.hasFeature(FEATURE.englishLab));
const isValidCategory = computed(() => labStore.categories.includes(category.value));

const categoryFeatureMap: Record<string, string> = {
  animals: FEATURE.englishLabAnimals,
  fruits: FEATURE.englishLabFruits,
  actions: FEATURE.englishLabActions,
  bodyParts: FEATURE.englishLabBody,
  emotions: FEATURE.englishLabEmotions
};

onMounted(async () => {
  const activeUserId = auth.isStudent ? auth.studentId : auth.teacherId;
  labStore.setUserId(activeUserId ?? null);
  if (!labStore.categories.length) {
    await labStore.loadCategories();
  }
});

watch(
  category,
  async (next) => {
    if (!next || !isValidCategory.value) {
      return;
    }
    await labStore.ensureVocabulary(next);
  },
  { immediate: true }
);

watch(
  () => [labStore.categories.slice(), category.value],
  () => {
    if (labStore.categories.length && !isValidCategory.value) {
      router.replace({ name: 'student-english-lab-home' });
    }
  },
  { immediate: true, deep: true }
);

const labelFor = (value: string) => t(`labEnglish.categories.${value}` as const, value);

const words = computed(() => labStore.vocabularies[category.value]?.items ?? []);
const mastered = computed(() => labStore.masteredCounts[category.value] ?? 0);

const categoryEnabled = computed(() => {
  const featureCode = categoryFeatureMap[category.value];
  if (!labEnabled.value || !isValidCategory.value) {
    return false;
  }
  if (!featureCode) {
    return true;
  }
  return features.hasFeature(featureCode as any);
});

const quizRoute = computed(() => ({ name: 'student-english-lab-quiz', params: { category: category.value } }));

const navigateTo = (value: string) => {
  router.push({ name: 'student-english-lab-category', params: { category: value } });
};

const handleSpoken = () => {
  // reserved for analytics hooks; noop for now
};
</script>

<style scoped>
.lab-category {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.lab-category__locked {
  text-align: center;
  padding: 2rem;
  background: rgba(248, 113, 113, 0.12);
  border-radius: 16px;
  color: var(--muse-danger, #dc2626);
}

.lab-category__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.lab-category__footer {
  display: flex;
  justify-content: center;
}

.lab-category__quiz {
  padding: 0.75rem 1.5rem;
  border-radius: 999px;
  background: var(--muse-primary, #2563eb);
  color: #fff;
  text-decoration: none;
}
</style>
