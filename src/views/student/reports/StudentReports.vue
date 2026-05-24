<template>
  <ThemePage :title="t('studentReports.title')" :subtitle="t('studentReports.subtitle')">
    <section class="student-reports">
      <UiCard class="student-reports__filters" hover>
        <header class="student-reports__filters-header">
          <h2>{{ t('studentReports.filters.title') }}</h2>
          <p>{{ t('studentReports.filters.caption') }}</p>
        </header>
        <div class="student-reports__filters-grid">
          <UiInput
            v-model="filters.from"
            type="date"
            :label="t('studentReports.filters.from')"
          />
          <UiInput
            v-model="filters.to"
            type="date"
            :label="t('studentReports.filters.to')"
          />
          <UiSelect
            :model-value="filters.bucket"
            :label="t('studentReports.filters.bucket.label')"
            @update:model-value="onBucketChange"
          >
            <option v-for="option in bucketOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </UiSelect>
          <UiSelect
            :model-value="filters.metric"
            :label="t('studentReports.filters.metric.label')"
            @update:model-value="onMetricChange"
          >
            <option v-for="option in metricOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </UiSelect>
          <div class="student-reports__filters-actions">
            <UiButton
              variant="link"
              color="secondary"
              prepend-icon="ReloadOutlined"
              :disabled="isLoading"
              @click="resetFilters"
            >
              {{ t('studentReports.filters.reset') }}
            </UiButton>
            <UiButton
              prepend-icon="LineChartOutlined"
              :disabled="isLoading"
              @click="refreshReports"
            >
              {{ t('studentReports.filters.apply') }}
            </UiButton>
          </div>
        </div>
      </UiCard>

      <UiAlert v-if="error" color="danger" variant="soft">
        {{ error }}
      </UiAlert>

      <div class="student-reports__grid">
        <AnalyticsChartCard
          class="student-reports__card"
          :title="t('studentReports.progress.title')"
          :subtitle="t('studentReports.progress.subtitle')"
          :values="progressValues"
          :labels="progressLabels"
          :loading="loading.progress"
          :empty-label="t('studentReports.empty')"
        />

        <AnalyticsChartCard
          class="student-reports__card"
          :title="t('studentReports.engagement.title')"
          :subtitle="engagementSubtitle"
          :values="engagementValues"
          :labels="engagementLabels"
          :loading="loading.engagement"
          :empty-label="t('studentReports.empty')"
        />
      </div>
    </section>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import ThemePage from '@/layout/theme/ThemePage.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import AnalyticsChartCard from '@/components/charts/AnalyticsChartCard.vue';
import {
  getEngagementSeries,
  getProgressSeries,
  type StudentEngagementSeriesParams,
  type StudentEngagementSeriesResponse,
  type StudentProgressSeriesParams,
  type StudentProgressSeriesResponse
} from '@/api/reportsStudent';

interface Filters {
  from: string;
  to: string;
  bucket: 'week' | 'month';
  metric: 'watchTime' | 'liveSeconds';
}

interface SelectOption {
  label: string;
  value: Filters['bucket'] | Filters['metric'];
}

const { t, locale } = useI18n();

const today = new Date();
const defaultFrom = new Date();
defaultFrom.setDate(today.getDate() - 42);

const filters = reactive<Filters>({
  from: formatInputDate(defaultFrom),
  to: formatInputDate(today),
  bucket: 'week',
  metric: 'watchTime'
});

const loading = reactive({
  progress: false,
  engagement: false
});

const error = ref('');

const progressSeries = ref<StudentProgressSeriesResponse>({ bucket: 'week', points: [] });
const engagementSeries = ref<StudentEngagementSeriesResponse>({ metric: 'watchTime', points: [] });

const bucketOptions = computed<SelectOption[]>(() => [
  { label: t('studentReports.filters.bucket.week'), value: 'week' },
  { label: t('studentReports.filters.bucket.month'), value: 'month' }
]);

const metricOptions = computed<SelectOption[]>(() => [
  { label: t('studentReports.filters.metric.watchTime'), value: 'watchTime' },
  { label: t('studentReports.filters.metric.liveSeconds'), value: 'liveSeconds' }
]);

const isLoading = computed(() => loading.progress || loading.engagement);

const localeTag = computed(() => (locale.value === 'ar' ? 'ar-EG' : 'en-US'));
const dateFormatter = computed(() =>
  new Intl.DateTimeFormat(localeTag.value, { month: 'short', day: 'numeric' })
);

const progressValues = computed(() =>
  progressSeries.value.points.map((point) => Number(point.value) || 0)
);
const progressLabels = computed(() =>
  progressSeries.value.points.map((point) => formatDisplayDate(point.period))
);

const engagementValues = computed(() =>
  engagementSeries.value.points.map((point) => Number(point.value) || 0)
);
const engagementLabels = computed(() =>
  engagementSeries.value.points.map((point) => formatDisplayDate(point.period))
);

const engagementSubtitle = computed(() =>
  filters.metric === 'watchTime'
    ? t('studentReports.engagement.subtitleWatchTime')
    : t('studentReports.engagement.subtitleLiveSeconds')
);

const refreshReports = async () => {
  if (filters.from && filters.to && new Date(filters.from) > new Date(filters.to)) {
    error.value = t('studentReports.validation.range');
    return;
  }
  error.value = '';
  await Promise.all([loadProgressSeries(), loadEngagementSeries()]);
};

const loadProgressSeries = async () => {
  loading.progress = true;
  try {
    const params: StudentProgressSeriesParams = {
      from: filters.from || undefined,
      to: filters.to || undefined,
      bucket: filters.bucket
    };
    progressSeries.value = await getProgressSeries(params);
  } catch (err) {
    console.error('[student-reports] failed to load progress series', err);
    error.value = t('studentReports.error');
    progressSeries.value = { bucket: filters.bucket, points: [] };
  } finally {
    loading.progress = false;
  }
};

const loadEngagementSeries = async () => {
  loading.engagement = true;
  try {
    const params: StudentEngagementSeriesParams = {
      from: filters.from || undefined,
      to: filters.to || undefined,
      metric: filters.metric
    };
    engagementSeries.value = await getEngagementSeries(params);
  } catch (err) {
    console.error('[student-reports] failed to load engagement series', err);
    if (!error.value) {
      error.value = t('studentReports.error');
    }
    engagementSeries.value = { metric: filters.metric, points: [] };
  } finally {
    loading.engagement = false;
  }
};

const resetFilters = () => {
  filters.from = formatInputDate(defaultFrom);
  filters.to = formatInputDate(today);
  filters.bucket = 'week';
  filters.metric = 'watchTime';
  refreshReports();
};

const onBucketChange = (value: string | number | null) => {
  filters.bucket = (value ? String(value) : 'week') as Filters['bucket'];
};

const onMetricChange = (value: string | number | null) => {
  filters.metric = (value ? String(value) : 'watchTime') as Filters['metric'];
};

const formatDisplayDate = (value: string) => {
  try {
    return dateFormatter.value.format(new Date(value));
  } catch (err) {
    console.warn('[student-reports] unable to format date label', err);
    return value;
  }
};

function formatInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

onMounted(async () => {
  await refreshReports();
});
</script>

<style scoped>
.student-reports {
  display: grid;
  gap: var(--sakai-space-6);
}

.student-reports__filters {
  display: grid;
  gap: var(--sakai-space-4);
}

.student-reports__filters-header {
  display: grid;
  gap: var(--sakai-space-2);
}

.student-reports__filters-grid {
  display: grid;
  gap: var(--sakai-space-4);
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.student-reports__filters-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--sakai-space-3);
  grid-column: 1 / -1;
}

.student-reports__grid {
  display: grid;
  gap: var(--sakai-space-4);
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}

.student-reports__card {
  display: grid;
  gap: var(--sakai-space-4);
}

.student-reports__chart {
  display: grid;
  gap: var(--sakai-space-3);
}

.student-reports__empty {
  text-align: center;
  color: var(--sakai-text-color-tertiary);
  font-size: 0.9rem;
}
</style>
