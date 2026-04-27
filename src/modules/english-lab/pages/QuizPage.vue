<template>
  <div class="lab-quiz">
    <header class="lab-quiz__header">
      <h1>{{ labelFor(category) }}</h1>
      <p>{{ t('labEnglish.quiz.listenChoose.subtitle') }}</p>
      <label class="lab-quiz__toggle">
        <input type="checkbox" v-model="spellItEnabled" />
        {{ t('labEnglish.quiz.spellToggle') }}
      </label>
    </header>

    <section v-if="!labEnabled || !categoryEnabled" class="lab-quiz__locked">
      <p>{{ t('labEnglish.errors.categoryDisabled') }}</p>
    </section>

    <section v-else>
      <div v-if="loading" class="lab-quiz__loading">{{ t('labEnglish.loading') }}</div>
      <div v-else-if="error" class="lab-quiz__error">{{ error }}</div>
      <QuizListenChoose
        v-else
        :items="quizItems"
        @answered="handleAnswer"
        @complete="handleComplete"
      />
      <button type="button" class="lab-quiz__retry" @click="reload(true)">
        {{ t('labEnglish.buttons.retry') }}
      </button>
      <p v-if="spellItEnabled" class="lab-quiz__coming-soon">
        {{ t('labEnglish.quiz.spellComingSoon') }}
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import QuizListenChoose from '../components/QuizListenChoose.vue';
import { useEnglishLabStore } from '../store/englishLab.store';
import type { QuizItemDto } from '../services/englishLabApi';
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
const spellItEnabled = ref(false);
const loading = ref(false);
const error = ref('');
const quizItems = ref<QuizItemDto[]>([]);

const categoryFeatureMap: Record<string, string> = {
  animals: FEATURE.englishLabAnimals,
  fruits: FEATURE.englishLabFruits,
  actions: FEATURE.englishLabActions,
  bodyParts: FEATURE.englishLabBody,
  emotions: FEATURE.englishLabEmotions
};

const labEnabled = computed(() => features.hasFeature(FEATURE.englishLab));

const isValidCategory = computed(() => labStore.categories.includes(category.value));

const categoryEnabled = computed(() => {
  if (!labEnabled.value || !isValidCategory.value) {
    return false;
  }
  const featureCode = categoryFeatureMap[category.value];
  if (!featureCode) {
    return true;
  }
  return features.hasFeature(featureCode as any);
});

const labelFor = (value: string) => t(`labEnglish.categories.${value}` as const, value);

const loadQuiz = async (force = false) => {
  if (!categoryEnabled.value || !category.value) {
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    quizItems.value = await labStore.fetchQuiz(category.value, 4, force);
  } catch (err) {
    console.error('[english-lab] quiz load failed', err);
    error.value = t('labEnglish.errors.loadQuiz');
  } finally {
    loading.value = false;
  }
};

const reload = (force = false) => {
  quizItems.value = [];
  loadQuiz(force);
};

const handleAnswer = async ({ vocabId, correct }: { vocabId: string; correct: boolean }) => {
  await labStore.submitProgressUpdate(category.value, vocabId, correct, 1);
};

const handleComplete = () => {
  // reserved for future analytics hooks
};

const redirectIfInvalid = () => {
  if (labStore.categories.length && !isValidCategory.value) {
    router.replace({ name: 'student-english-lab-home' });
  }
};

onMounted(async () => {
  const activeUserId = auth.isStudent ? auth.studentId : auth.teacherId;
  labStore.setUserId(activeUserId ?? null);
  if (!labStore.categories.length) {
    await labStore.loadCategories();
  }
  redirectIfInvalid();
  await loadQuiz();
});

watch(category, async () => {
  redirectIfInvalid();
  await loadQuiz();
});

watch(
  () => labStore.categories.slice(),
  () => redirectIfInvalid(),
  { immediate: true }
);
</script>

<style scoped>
.lab-quiz {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.lab-quiz__header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.lab-quiz__toggle {
  font-size: 0.875rem;
  color: var(--muse-text-muted, #64748b);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.lab-quiz__locked {
  text-align: center;
  padding: 2rem;
  background: rgba(248, 113, 113, 0.12);
  border-radius: 16px;
  color: var(--muse-danger, #dc2626);
}

.lab-quiz__loading {
  text-align: center;
}

.lab-quiz__error {
  text-align: center;
  color: var(--muse-danger, #dc2626);
}

.lab-quiz__retry {
  margin-top: 1.5rem;
  padding: 0.5rem 1.25rem;
  border-radius: 999px;
  border: 1px solid var(--muse-border, #d1d5db);
  background: var(--muse-surface, #fff);
  cursor: pointer;
}

.lab-quiz__coming-soon {
  text-align: center;
  color: var(--muse-text-muted, #94a3b8);
}
</style>
