<template>
  <ThemePage
    :title="t('achievements.title')"
    :subtitle="t('achievements.subtitle')"
  >
    <template #actions>
      <UiTabs
        class="student-achievements__tabs"
        :tabs="periodTabs"
        :model-value="selectedPeriod"
        variant="pill"
        @update:model-value="onPeriodChange"
      />
    </template>

    <div class="student-achievements grid gap-6">
      <UiCard class="student-achievements__certificates" :title="t('achievements.certificates')">
        <div v-if="store.loading && !certificates.length" class="student-achievements__loading inline-flex items-center gap-2 text-content-tertiary font-medium">
          {{ t('common.loading') }}
        </div>
        <UiAlert v-else-if="!certificates.length" color="info">
          {{ t('achievements.noCertificates') }}
        </UiAlert>
        <ol v-else class="student-achievements__timeline">
          <li
            v-for="certificate in certificatesWithCache"
            :key="certificate.id"
            class="student-achievements__timeline-item relative pl-8 flex gap-4"
          >
            <div class="student-achievements__timeline-marker" />
            <div class="student-achievements__timeline-content">
              <span class="student-achievements__timeline-date text-sm text-content-tertiary">{{ formatDate(certificate.issuedAt) }}</span>
              <h3 class="student-achievements__timeline-title m-0 font-semibold text-content">{{ certificate.courseTitle }}</h3>
              <p class="student-achievements__timeline-subtitle m-0 text-content-secondary">{{ t('achievements.certificateLabel') }}</p>
              <UiButton
                class="student-achievements__timeline-action self-start"
                variant="outline"
                color="primary"
                prepend-icon="DownloadOutlined"
                :href="certificate.downloadUrl"
                target="_blank"
                rel="noopener"
              >
                {{ t('achievements.download') }}
              </UiButton>
            </div>
          </li>
        </ol>
      </UiCard>

      <div class="student-achievements__side flex flex-col gap-6">
        <UiCard :title="t('achievements.leaderboard')">
          <div v-if="store.loading && !leaderboardEntries.length" class="student-achievements__loading inline-flex items-center gap-2 text-content-tertiary font-medium">
            {{ t('common.loading') }}
          </div>
          <UiAlert v-else-if="!leaderboardEntries.length" color="info">
            {{ t('achievements.noLeaderboard') }}
          </UiAlert>
          <UiTable
            v-else
            class="student-achievements__table overflow-x-auto"
            :headers="leaderboardHeaders"
            :items="leaderboardEntries"
            density="comfortable"
          >
            <template #item.rank="{ item }">
              <span class="student-achievements__rank font-semibold text-content">#{{ item.rank }}</span>
            </template>
            <template #item.points="{ item }">
              <strong>{{ item.points }}</strong>
            </template>
          </UiTable>
        </UiCard>

        <UiCard :title="t('achievements.badges')">
          <div v-if="store.loading && !badgesWithCache.length" class="student-achievements__loading inline-flex items-center gap-2 text-content-tertiary font-medium">
            {{ t('common.loading') }}
          </div>
          <UiAlert v-else-if="!badgesWithCache.length" color="info">
            {{ t('achievements.noBadges') }}
          </UiAlert>
          <ul v-else class="student-achievements__badges m-0 p-0 list-none grid gap-4">
            <li v-for="badge in badgesWithCache" :key="badge.id" class="student-achievements__badge">
              <div v-if="badge.iconSrc" class="student-achievements__badge-icon">
                <img :src="badge.iconSrc" alt="" />
              </div>
              <div class="student-achievements__badge-content flex flex-col gap-2">
                <span class="student-achievements__badge-name font-medium text-content">{{ badge.name }}</span>
                <span class="student-achievements__badge-date text-sm text-content-tertiary">{{ formatDate(badge.earnedAt) }}</span>
              </div>
            </li>
          </ul>
        </UiCard>
      </div>
    </div>
 
  </ThemePage>
</template>

<script setup lang="ts">
/**
 * StudentAchievementsView presents earned certificates, badges, and
 * leaderboard standings for the logged in student while allowing time period
 * filtering.
 *
 * This component does not accept props. It coordinates with the achievements
 * store to fetch timeline data, exposes period tabs for filtering, and renders
 * localized copy via vue-i18n.
 */
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAchievementsStore } from '@/stores/achievements';
import { withCacheBusting } from '@/utils/cacheBusting';
import type { LeaderboardPeriod } from '@/services/achievements';
import UiTabs from '@/components/ui/UiTabs.vue';

const { t } = useI18n();
const store = useAchievementsStore();
const selectedPeriod = ref<LeaderboardPeriod>('alltime');

/**
 * Provides tab metadata for switching between leaderboard time periods.
 */
const periodTabs = computed(() => [
  { value: 'weekly', label: t('achievements.period.weekly') },
  { value: 'monthly', label: t('achievements.period.monthly') },
  { value: 'alltime', label: t('achievements.period.alltime') }
]);

/**
 * Column definitions for the leaderboard table including alignments.
 */
const leaderboardHeaders = computed(() => [
  { title: '#', key: 'rank', sortable: false },
  { title: t('achievements.student'), key: 'studentName' },
  { title: t('achievements.points'), key: 'points', align: 'end' }
]);

/**
 * Loads achievements data when the view becomes active using the default
 * selected period.
 */
onMounted(() => {
  store.load(selectedPeriod.value);
});

/**
 * Reactively reloads achievements whenever the selected leaderboard period
 * changes.
 *
 * @param period newly selected period value.
 */
watch(selectedPeriod, (period) => {
  store.load(period);
});

/**
 * Certificates earned by the student sorted from the achievements store.
 */
const certificates = computed(() => store.data?.certificates ?? []);
const certificatesWithCache = computed(() =>
  certificates.value.map((certificate) => ({
    ...certificate,
    downloadUrl: withCacheBusting(certificate.pdfUrl)
  }))
);

/**
 * Badge achievements available for display in the sidebar list.
 */
const badges = computed(() => store.data?.badges ?? []);
const badgesWithCache = computed(() =>
  badges.value.map((badge) => ({
    ...badge,
    iconSrc: badge.iconUrl ? withCacheBusting(badge.iconUrl) : ''
  }))
);

/**
 * Leaderboard entries scoped to the current period for table rendering.
 */
const leaderboardEntries = computed(() => store.data?.leaderboard.entries ?? []);

/**
 * Applies the tab selection to the reactive period ref to trigger data loads.
 *
 * @param value tab payload emitted from UiTabs.
 */
function onPeriodChange(value: string | number) {
  selectedPeriod.value = value as LeaderboardPeriod;
}

/**
 * Formats ISO date strings for certificate and badge timelines using the
 * browser locale.
 *
 * @param value ISO timestamp to format.
 * @returns localized date string.
 */
function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}
</script>

<style scoped>
.student-achievements__tabs :deep(.ui-tabs__content) {
  display: none;
}

@media (min-width: 1024px) {
  .student-achievements {
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    align-items: flex-start;
  }
}

.student-achievements__certificates :deep(.ui-card__body),
.student-achievements__side :deep(.ui-card__body) {
  gap: var(--sakai-space-5);
}

.student-achievements__timeline {
  position: relative;
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-5);
}

.student-achievements__timeline::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0.875rem;
  width: 2px;
  background: color-mix(in srgb, var(--sakai-primary) 25%, transparent);
}

.student-achievements__timeline-marker {
  position: absolute;
  left: calc(0.875rem - var(--sakai-space-2));
  top: 0.35rem;
  width: var(--sakai-space-4);
  height: var(--sakai-space-4);
  border-radius: 50%;
  background: var(--sakai-primary);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--sakai-primary) 15%, transparent);
}

.student-achievements__timeline-content {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-2);
  background: var(--sakai-surface);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 75%, transparent);
  border-radius: var(--sakai-border-radius-lg);
  padding: var(--sakai-space-4);
  box-shadow: var(--sakai-shadow-sm);
}

.student-achievements__table :deep(table) {
  min-width: calc(var(--sakai-space-12) * 6);
}

.student-achievements__badge {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-4);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 80%, transparent);
  background: var(--sakai-surface);
}

.student-achievements__badge-icon {
  width: var(--sakai-space-8);
  height: var(--sakai-space-8);
  border-radius: var(--sakai-border-radius-pill);
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--sakai-primary) 10%, transparent);
  overflow: hidden;
}

.student-achievements__badge-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
