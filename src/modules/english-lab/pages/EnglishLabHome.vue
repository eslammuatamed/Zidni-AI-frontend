<template>
  <div class="lab-home">
    <header class="lab-home__hero">
      <div class="lab-home__hero-content">
        <h1>{{ t('labEnglish.titles.home') }}</h1>
        <p>{{ t('labEnglish.subtitles.home') }}</p>
        <ProgressBadge
          class="lab-home__hero-badge"
          :mastered="totalMastered"
          :total="totalVocabulary"
        />
        <p v-if="!hasProgress" class="lab-home__hero-hint">
          {{ t('labEnglish.hints.getStarted') }}
        </p>
        <div v-else class="lab-home__hero-actions">
          <RouterLink
            :to="learnRoute(lastActiveCategory.category)"
            class="lab-home__pill"
          >
            {{ t('labEnglish.buttons.continueCategory', { category: lastActiveCategory.label }) }}
          </RouterLink>
          <RouterLink
            :to="quizRoute(lastActiveCategory.category)"
            class="lab-home__pill lab-home__pill--secondary"
          >
            {{ t('labEnglish.buttons.practiceQuiz', { category: lastActiveCategory.label }) }}
          </RouterLink>
        </div>
      </div>
    </header>

    <section v-if="!labEnabled" class="lab-home__locked">
      <p>{{ t('labEnglish.errors.featureDisabled') }}</p>
    </section>

    <section v-else>
      <p v-if="labStore.categoriesState.error" class="lab-home__error">
        {{ t(labStore.categoriesState.error) }}
      </p>
      <div
        v-if="isLoading"
        class="lab-home__loading"
        role="status"
        aria-live="polite"
      >
        <div class="lab-home__loading-icon" aria-hidden="true" />
        <p>{{ t('common.loading') }}</p>
      </div>

      <template v-else>
        <section
          class="lab-home__assignments"
          aria-labelledby="lab-home-assignments"
        >
          <div class="lab-home__section-header">
            <h2 id="lab-home-assignments">{{ t('labEnglish.titles.assignments') }}</h2>
            <p>{{ t('labEnglish.subtitles.assignments') }}</p>
          </div>

          <p v-if="assignmentsError" class="lab-home__error">
            {{ t(assignmentsError) }}
          </p>

          <div v-else-if="assignmentsLoading" class="lab-home__loading-inline" role="status">
            <div class="lab-home__loading-icon" aria-hidden="true" />
            <p>{{ t('labEnglish.loadingAssignments') }}</p>
          </div>

          <ul v-else-if="assignmentList.length" class="lab-home__assignments-list">
            <li
              v-for="assignment in assignmentList"
              :key="assignment.id"
              class="lab-home__assignment"
            >
              <div class="lab-home__assignment-main">
                <h3>{{ assignment.title }}</h3>
                <p>
                  {{ t('labEnglish.labels.assignmentCategory', { category: assignment.categoryLabel }) }}
                </p>
              </div>
              <div class="lab-home__assignment-meta">
                <span class="lab-home__assignment-due">
                  {{ assignment.dueDateLabel }}
                </span>
              </div>
            </li>
          </ul>

          <p v-else class="lab-home__empty">
            {{ t('labEnglish.emptyAssignments') }}
          </p>
        </section>

        <section
          class="lab-home__snapshot"
          aria-labelledby="lab-home-snapshot"
        >
          <div class="lab-home__section-header">
            <h2 id="lab-home-snapshot">{{ t('labEnglish.titles.snapshot') }}</h2>
            <p>{{ t('labEnglish.subtitles.snapshot') }}</p>
          </div>
          <div class="lab-home__stats-grid">
            <article class="lab-home__stat">
              <span class="lab-home__stat-label">{{ t('labEnglish.labels.wordsUnlocked') }}</span>
              <span class="lab-home__stat-value">{{ totalVocabulary }}</span>
              <p class="lab-home__stat-helper">
                {{ t('labEnglish.helpers.wordsUnlocked') }}
              </p>
            </article>
            <article class="lab-home__stat">
              <span class="lab-home__stat-label">{{ t('labEnglish.labels.wordsMastered') }}</span>
              <span class="lab-home__stat-value">{{ totalMastered }}</span>
              <p class="lab-home__stat-helper">
                {{ t('labEnglish.helpers.wordsMastered', { mastered: totalMastered }) }}
              </p>
            </article>
            <article class="lab-home__stat">
              <span class="lab-home__stat-label">{{ t('labEnglish.labels.averageCompletion') }}</span>
              <span class="lab-home__stat-value">{{ averageCompletion }}%</span>
              <p class="lab-home__stat-helper">
                {{ t('labEnglish.helpers.averageCompletion', { engaged: engagedWords }) }}
              </p>
            </article>
          </div>
        </section>

        <section
          v-if="categoryStats.length"
          class="lab-home__progress"
          aria-labelledby="lab-home-progress"
        >
          <div class="lab-home__section-header">
            <h2 id="lab-home-progress">{{ t('labEnglish.titles.categoryProgress') }}</h2>
            <p>{{ t('labEnglish.subtitles.categoryProgress') }}</p>
          </div>
          <ul class="lab-home__progress-list">
            <li
              v-for="stat in categoryStats"
              :key="stat.category"
              class="lab-home__progress-item"
            >
              <div class="lab-home__progress-row">
                <div>
                  <h3>{{ stat.label }}</h3>
                  <p>
                    {{ t('labEnglish.labels.masteryCount', { mastered: stat.mastered, total: stat.total }) }}
                  </p>
                </div>
                <span class="lab-home__progress-value">{{ stat.completion }}%</span>
              </div>
              <div class="lab-home__progress-bar" role="presentation">
                <span
                  class="lab-home__progress-bar-fill"
                  :style="{ width: `${stat.completion}%` }"
                />
              </div>
            </li>
          </ul>
        </section>

        <div class="lab-home__section-header">
          <h2>{{ t('labEnglish.titles.categories') }}</h2>
          <p>{{ t('labEnglish.subtitles.categories') }}</p>
        </div>
        <div class="lab-home__grid">
          <article
            v-for="category in availableCategories"
            :key="category"
            class="lab-home__card"
          >
            <h2>{{ labelFor(category) }}</h2>
            <p>{{ t('labEnglish.subtitles.categoryCard', { category: labelFor(category) }) }}</p>
            <ProgressBadge
              :mastered="masteredFor(category)"
              :total="totalFor(category)"
            />
            <div class="lab-home__actions">
              <RouterLink :to="learnRoute(category)" class="lab-home__action">
                {{ t('labEnglish.buttons.learn') }}
              </RouterLink>
              <RouterLink :to="quizRoute(category)" class="lab-home__action">
                {{ t('labEnglish.buttons.quiz') }}
              </RouterLink>
            </div>
          </article>
        </div>
        <p v-if="!availableCategories.length" class="lab-home__empty">
          {{ t('labEnglish.errors.noCategories') }}
        </p>

        <section class="lab-home__tips" aria-labelledby="lab-home-tips">
          <div class="lab-home__section-header">
            <h2 id="lab-home-tips">{{ t('labEnglish.titles.tips') }}</h2>
            <p>{{ t('labEnglish.subtitles.tips') }}</p>
          </div>
          <ul class="lab-home__tips-list">
            <li v-for="tip in tipKeys" :key="tip" class="lab-home__tips-item">
              <h3>{{ t(`labEnglish.tips.${tip}.title`) }}</h3>
              <p>{{ t(`labEnglish.tips.${tip}.body`) }}</p>
            </li>
          </ul>
        </section>
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import ProgressBadge from '../components/ProgressBadge.vue';
import { useEnglishLabStore } from '../store/englishLab.store';
import { useAuthStore } from '@/stores/auth';
import { useFeaturesStore } from '@/stores/features';
import { FEATURE } from '@/constants/featureCatalog';

const { t, locale: i18nLocale } = useI18n();
const labStore = useEnglishLabStore();
const auth = useAuthStore();
const features = useFeaturesStore();
const { masteredCounts, completionByCategory, progress, assignments, assignmentsState } =
  storeToRefs(labStore);

onMounted(async () => {
  const activeUserId = auth.isStudent ? auth.studentId : auth.teacherId;
  labStore.setUserId(activeUserId ?? null);
  await Promise.all([labStore.loadCategories(), labStore.loadAssignments()]);
});

const labEnabled = computed(() => features.hasFeature(FEATURE.englishLab));
const isLoading = computed(
  () => labStore.categoriesState.loading && !labStore.categoriesState.loaded
);

const assignmentsLoading = computed(
  () => assignmentsState.value.loading && !assignmentsState.value.loaded
);

const assignmentsError = computed(() => assignmentsState.value.error);

const categoryFeatureMap: Record<string, string> = {
  animals: FEATURE.englishLabAnimals,
  fruits: FEATURE.englishLabFruits,
  actions: FEATURE.englishLabActions,
  bodyParts: FEATURE.englishLabBody,
  emotions: FEATURE.englishLabEmotions
};

const availableCategories = computed(() =>
  labStore.categories.filter((category) => {
    const featureCode = categoryFeatureMap[category];
    if (!featureCode) {
      return true;
    }
    return features.hasFeature(featureCode as any);
  })
);

watch(
  () => availableCategories.value.slice(),
  async (categories) => {
    await Promise.all(categories.map((category) => labStore.ensureVocabulary(category)));
  },
  { immediate: true }
);

const totalMastered = computed(() =>
  availableCategories.value.reduce((total, category) => total + masteredFor(category), 0)
);

const totalVocabulary = computed(() =>
  availableCategories.value.reduce((total, category) => total + totalFor(category), 0)
);

const masteredFor = (category: string) => masteredCounts.value[category] ?? 0;

const totalFor = (category: string) => labStore.vocabularies[category]?.items.length ?? 0;

const completionFor = (category: string) => completionByCategory.value[category] ?? 0;

const practicedFor = (category: string) =>
  Object.keys(progress.value[category] ?? {}).length;

const engagedWords = computed(() =>
  availableCategories.value.reduce((total, category) => total + practicedFor(category), 0)
);

const averageCompletion = computed(() => {
  const stats = availableCategories.value
    .map((category) => completionFor(category))
    .filter((value) => value > 0);
  if (!stats.length) {
    return 0;
  }
  const sum = stats.reduce((total, value) => total + value, 0);
  return Math.round(sum / stats.length);
});

const labelFor = (category: string) => t(`labEnglish.categories.${category}` as const, category);

const learnRoute = (category: string) => ({ name: 'student-english-lab-category', params: { category } });
const quizRoute = (category: string) => ({ name: 'student-english-lab-quiz', params: { category } });

const categoryStats = computed(() =>
  availableCategories.value.map((category) => ({
    category,
    label: labelFor(category),
    total: totalFor(category),
    mastered: masteredFor(category),
    completion: completionFor(category),
    practiced: practicedFor(category)
  }))
);

const lastActiveCategory = computed(() => {
  const stats = categoryStats.value.filter((stat) => stat.practiced > 0 || stat.mastered > 0);
  if (!stats.length) {
    return null;
  }
  return stats
    .slice()
    .sort((a, b) => {
      if (b.practiced === a.practiced) {
        if (b.completion === a.completion) {
          return (
            availableCategories.value.indexOf(a.category) -
            availableCategories.value.indexOf(b.category)
          );
        }
        return b.completion - a.completion;
      }
      return b.practiced - a.practiced;
    })[0];
});

const hasProgress = computed(() => Boolean(lastActiveCategory.value));

const localeCode = computed(() => i18nLocale.value || undefined);

const assignmentList = computed(() =>
  assignments.value.map((assignment) => {
    const dueDateLabel = assignment.dueDate
      ? new Intl.DateTimeFormat(localeCode.value, { dateStyle: 'medium' }).format(
          new Date(assignment.dueDate)
        )
      : t('labEnglish.labels.noDueDate');
    return {
      ...assignment,
      dueDateLabel,
      categoryLabel: labelFor(assignment.category as string)
    };
  })
);

const tipKeys = ['repeatDaily', 'listenFirst', 'mixModes'];
</script>

<style scoped>
.lab-home {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.lab-home__hero {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(14, 165, 233, 0.16));
  border-radius: 24px;
  padding: 2.5rem 2rem;
  display: flex;
  justify-content: center;
}

.lab-home__hero-content {
  text-align: center;
  max-width: 640px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.lab-home__hero h1 {
  font-size: clamp(2rem, 4vw, 2.5rem);
  margin-bottom: 0.25rem;
}

.lab-home__hero-badge {
  align-self: center;
}

.lab-home__hero-hint {
  color: var(--muse-text-muted, #64748b);
}

.lab-home__hero-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
}

.lab-home__pill {
  padding: 0.65rem 1.4rem;
  border-radius: 999px;
  background: var(--muse-surface, #fff);
  color: var(--muse-primary, #2563eb);
  text-decoration: none;
  font-weight: 600;
  box-shadow: var(--muse-shadow-sm, 0 4px 12px rgba(37, 99, 235, 0.18));
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.lab-home__pill:hover {
  transform: translateY(-2px);
  box-shadow: var(--muse-shadow-md, 0 10px 24px rgba(37, 99, 235, 0.2));
}

.lab-home__pill--secondary {
  background: rgba(37, 99, 235, 0.12);
  color: var(--muse-primary, #2563eb);
  box-shadow: none;
}

.lab-home__locked {
  text-align: center;
  padding: 2rem;
  background: rgba(248, 113, 113, 0.12);
  border-radius: 16px;
  color: var(--muse-danger, #dc2626);
}

.lab-home__error {
  text-align: center;
  color: var(--muse-danger, #dc2626);
}

.lab-home__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  border-radius: 16px;
  background: var(--muse-surface, #fff);
  box-shadow: var(--muse-shadow-md, 0 6px 20px rgba(15, 23, 42, 0.08));
  color: var(--muse-text-muted, #64748b);
  font-weight: 600;
}

.lab-home__loading-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 4px solid rgba(37, 99, 235, 0.2);
  border-top-color: var(--muse-primary, #2563eb);
  animation: lab-home-spin 1s linear infinite;
}

.lab-home__section-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: left;
}

.lab-home__section-header h2 {
  font-size: 1.5rem;
}

.lab-home__section-header p {
  color: var(--muse-text-muted, #64748b);
}

.lab-home__snapshot,
.lab-home__progress,
.lab-home__tips,
.lab-home__assignments {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  border-radius: 20px;
  background: var(--muse-surface, #fff);
  box-shadow: var(--muse-shadow-md, 0 6px 20px rgba(15, 23, 42, 0.08));
}

.lab-home__assignments-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.lab-home__assignment {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-radius: 14px;
  background: rgba(59, 130, 246, 0.08);
}

.lab-home__assignment-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.lab-home__assignment-main h3 {
  margin: 0 0 0.25rem;
}

.lab-home__assignment-main p {
  margin: 0;
  color: var(--muse-text-muted, #64748b);
}

.lab-home__assignment-due {
  font-weight: 600;
  color: var(--muse-primary-dark, #1d4ed8);
}

.lab-home__loading-inline {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.lab-home__stats-grid {
  display: grid;
  gap: 1.25rem;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.lab-home__stat {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.lab-home__stat-label {
  color: var(--muse-text-muted, #64748b);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 0.75rem;
}

.lab-home__stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--muse-primary-dark, #1d4ed8);
}

.lab-home__stat-helper {
  color: var(--muse-text-muted, #64748b);
  font-size: 0.95rem;
}

.lab-home__progress-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0;
  margin: 0;
}

.lab-home__progress-item {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.lab-home__progress-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
}

.lab-home__progress-row h3 {
  margin: 0;
  font-size: 1.1rem;
}

.lab-home__progress-row p {
  margin: 0;
  color: var(--muse-text-muted, #64748b);
}

.lab-home__progress-value {
  font-weight: 600;
}

.lab-home__progress-bar {
  height: 8px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.2);
  overflow: hidden;
}

.lab-home__progress-bar-fill {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--muse-primary, #2563eb), #38bdf8);
}

.lab-home__grid {
  display: grid;
  gap: 2rem;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.lab-home__card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 16px;
  background: var(--muse-surface, #fff);
  box-shadow: var(--muse-shadow-md, 0 6px 16px rgba(15, 23, 42, 0.12));
}

.lab-home__actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.lab-home__action {
  padding: 0.5rem 1rem;
  border-radius: 999px;
  background: var(--muse-primary, #2563eb);
  color: #fff;
  text-decoration: none;
}

.lab-home__empty {
  text-align: center;
  color: var(--muse-text-muted, #64748b);
}

.lab-home__tips-list {
  list-style: none;
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  padding: 0;
  margin: 0;
}

.lab-home__tips-item {
  background: rgba(37, 99, 235, 0.06);
  border-radius: 16px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.lab-home__tips-item h3 {
  margin: 0;
  font-size: 1.1rem;
}

.lab-home__tips-item p {
  margin: 0;
  color: var(--muse-text-muted, #64748b);
}

@keyframes lab-home-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@media (max-width: 600px) {
  .lab-home__hero {
    padding: 2rem 1.25rem;
  }

  .lab-home__snapshot,
  .lab-home__progress,
  .lab-home__tips {
    padding: 1.25rem;
  }
}
</style>
