<template>
  <ThemePage :title="t('analytics.overview.title')" :subtitle="t('analytics.overview.subtitle')">
    <template #actions>
      <UiButton to="/admin/analytics/export" prepend-icon="DownloadOutlined">
        {{ t('analytics.overview.actions.export') }}
      </UiButton>
    </template>
    <section class="admin-analytics">
      <UiAlert v-if="!analyticsEnabled" color="warning" variant="soft">
        {{ t('analytics.overview.planDisabled') }}
      </UiAlert>

      <div v-else>
        <UiAlert v-if="error" color="danger" variant="soft">
          {{ error }}
        </UiAlert>

        <div class="admin-analytics__grid">
          <UiStatCard
            v-for="card in cards"
            :key="card.key"
            :label="card.label"
            :value="card.value"
            :icon="card.icon"
            :color="card.color"
            :hover="false"
          />
        </div>

        <div class="admin-analytics__charts">
          <UiCard
            v-for="chart in chartConfigs"
            :key="chart.key"
            class="admin-analytics__chart-card"
            hover
          >
            <template #title>{{ chart.title }}</template>
            <template #subtitle>{{ chart.subtitle }}</template>
            <div class="admin-analytics__chart">
              <UiSkeleton v-if="chart.loading" height="200" animation="wave" />
              <UiChart
                v-else-if="chart.values.length"
                :values="chart.values"
                :labels="chart.labels"
                :height="200"
                :stroke="chart.stroke"
              />
              <p v-else class="admin-analytics__empty">{{ emptyStateLabel }}</p>
            </div>
          </UiCard>
        </div>
      </div>
    </section>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ThemePage from '@/layout/theme/ThemePage.vue';
import UiStatCard from '@/components/ui/UiStatCard.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiChart from '@/components/ui/UiChart.vue';
import UiSkeleton from '@/components/ui/UiSkeleton.vue';
import UiButton from '@/components/ui/UiButton.vue';
import { useVisibilityRefresh } from '@/composables/useVisibilityRefresh';
import { useFeaturesStore } from '@/stores/features';
import { FEATURE } from '@/constants/featureCatalog';
import {
  getOverview,
  getTeacherSeries,
  getStudentSeries,
  getRevenueSeries,
  type AdminAnalyticsOverviewResponse,
  type AdminAnalyticsTeacherSeriesPoint,
  type AdminAnalyticsStudentSeriesPoint,
  type AdminAnalyticsRevenueSeriesPoint
} from '@/api/analyticsAdmin';

interface StatCard {
  key: string;
  label: string;
  value: string | number;
  icon: string;
  color: 'primary' | 'info' | 'success' | 'warning' | 'danger';
}

const { t, locale } = useI18n();
const featuresStore = useFeaturesStore();
const analyticsEnabled = computed(() => featuresStore.hasFeature(FEATURE.analyticsPlatform));

const loading = ref(true);
const error = ref('');
const initialized = ref(false);
const overview = ref<AdminAnalyticsOverviewResponse>({
  totalTeachers: 0,
  activeTeachers: 0,
  totalStudents: 0,
  activeStudents: 0,
  totalRevenueManual: 0,
  totalRevenueTutoring: 0,
  avgRatingPlatform: 0,
  liveSessionsCount: 0,
  paymentsPending: 0
});
const chartsLoading = reactive({
  teachers: true,
  students: true,
  revenue: true
});
const teacherSeries = ref<AdminAnalyticsTeacherSeriesPoint[]>([]);
const studentSeries = ref<AdminAnalyticsStudentSeriesPoint[]>([]);
const revenueSeries = ref<AdminAnalyticsRevenueSeriesPoint[]>([]);
const analyticsRefreshInFlight = ref(false);

const localeTag = computed(() => (locale.value === 'ar' ? 'ar-EG' : 'en-US'));

const emptyStateLabel = computed(() => t('analytics.overview.emptySeries'));

const cards = computed<StatCard[]>(() => {
  const current = overview.value;
  const stats: StatCard[] = [
    {
      key: 'totalTeachers',
      label: t('analytics.overview.kpis.totalTeachers'),
      value: formatNumber(current.totalTeachers),
      icon: 'SchoolOutlined',
      color: 'primary'
    },
    {
      key: 'activeTeachers',
      label: t('analytics.overview.kpis.activeTeachers'),
      value: formatNumber(current.activeTeachers),
      icon: 'UserSwitchOutlined',
      color: 'info'
    },
    {
      key: 'totalStudents',
      label: t('analytics.overview.kpis.totalStudents'),
      value: formatNumber(current.totalStudents),
      icon: 'TeamOutlined',
      color: 'primary'
    },
    {
      key: 'activeStudents',
      label: t('analytics.overview.kpis.activeStudents'),
      value: formatNumber(current.activeStudents),
      icon: 'UserOutlined',
      color: 'info'
    },
    {
      key: 'totalRevenueManual',
      label: t('analytics.overview.kpis.totalRevenueManual'),
      value: formatCurrency(current.totalRevenueManual),
      icon: 'DollarOutlined',
      color: 'success'
    },
    {
      key: 'totalRevenueTutoring',
      label: t('analytics.overview.kpis.totalRevenueTutoring'),
      value: formatCurrency(current.totalRevenueTutoring),
      icon: 'CreditCardOutlined',
      color: 'success'
    },
    {
      key: 'avgRatingPlatform',
      label: t('analytics.overview.kpis.avgRatingPlatform'),
      value: formatRating(current.avgRatingPlatform),
      icon: 'StarOutlined',
      color: 'warning'
    },
    {
      key: 'liveSessionsCount',
      label: t('analytics.overview.kpis.liveSessionsCount'),
      value: formatNumber(current.liveSessionsCount),
      icon: 'VideoCameraOutlined',
      color: 'info'
    },
    {
      key: 'paymentsPending',
      label: t('analytics.overview.kpis.paymentsPending'),
      value: formatCurrency(current.paymentsPending),
      icon: 'FileTextOutlined',
      color: 'danger'
    }
  ];

  if (!initialized.value || loading.value) {
    return stats.map((card) => ({ ...card, value: '…' }));
  }

  return stats;
});

const teacherValues = computed(() => teacherSeries.value.map((point) => point.activeTeachers ?? 0));
const teacherLabels = computed(() => teacherSeries.value.map((point) => formatMonth(point.month)));
const studentValues = computed(() => studentSeries.value.map((point) => point.activeStudents ?? 0));
const studentLabels = computed(() => studentSeries.value.map((point) => formatMonth(point.month)));
const revenueValues = computed(() =>
  revenueSeries.value.map((point) =>
    Number(point.manualRevenue ?? 0) + Number(point.tutoringRevenue ?? 0)
  )
);
const revenueLabels = computed(() => revenueSeries.value.map((point) => formatMonth(point.month)));

const chartConfigs = computed(() => [
  {
    key: 'teachers',
    title: t('analytics.overview.charts.teachers.title'),
    subtitle: t('analytics.overview.charts.teachers.subtitle'),
    values: teacherValues.value,
    labels: teacherLabels.value,
    loading: chartsLoading.teachers,
    stroke: 'var(--sakai-primary)'
  },
  {
    key: 'students',
    title: t('analytics.overview.charts.students.title'),
    subtitle: t('analytics.overview.charts.students.subtitle'),
    values: studentValues.value,
    labels: studentLabels.value,
    loading: chartsLoading.students,
    stroke: 'var(--sakai-info)'
  },
  {
    key: 'revenue',
    title: t('analytics.overview.charts.revenue.title'),
    subtitle: t('analytics.overview.charts.revenue.subtitle'),
    values: revenueValues.value,
    labels: revenueLabels.value,
    loading: chartsLoading.revenue,
    stroke: 'var(--sakai-success)'
  }
]);

function formatNumber(value: number) {
  const safeValue = Number.isFinite(value) ? value : 0;
  try {
    return new Intl.NumberFormat(localeTag.value).format(safeValue);
  } catch (err) {
    console.warn('[AdminAnalytics] failed to format number', err);
    return String(safeValue);
  }
}

function formatCurrency(value: number) {
  const safeValue = Number.isFinite(value) ? value : 0;
  try {
    return new Intl.NumberFormat(localeTag.value, {
      style: 'currency',
      currency: 'EGP'
    }).format(safeValue);
  } catch (err) {
    console.warn('[AdminAnalytics] failed to format currency', err);
    return String(safeValue);
  }
}

function formatRating(value: number) {
  const safeValue = Number.isFinite(value) ? value : 0;
  return safeValue.toFixed(1);
}

async function loadOverview() {
  loading.value = true;
  error.value = '';
  chartsLoading.teachers = true;
  chartsLoading.students = true;
  chartsLoading.revenue = true;
  try {
    const [overviewData, teacherData, studentData, revenueData] = await Promise.all([
      getOverview(),
      getTeacherSeries(),
      getStudentSeries(),
      getRevenueSeries()
    ]);
    overview.value = overviewData;
    teacherSeries.value = teacherData.points ?? [];
    studentSeries.value = studentData.points ?? [];
    revenueSeries.value = revenueData.points ?? [];
  } catch (err) {
    console.error('[AdminAnalytics] failed to load analytics', err);
    error.value = t('analytics.overview.error');
    teacherSeries.value = [];
    studentSeries.value = [];
    revenueSeries.value = [];
  } finally {
    loading.value = false;
    chartsLoading.teachers = false;
    chartsLoading.students = false;
    chartsLoading.revenue = false;
    initialized.value = true;
  }
}

const refreshAnalytics = async (reason: string) => {
  if (analyticsRefreshInFlight.value || !analyticsEnabled.value) {
    return;
  }
  analyticsRefreshInFlight.value = true;
  try {
    console.info('[AdminAnalytics] refreshing analytics after %s', reason);
    await loadOverview();
  } finally {
    analyticsRefreshInFlight.value = false;
  }
};

useVisibilityRefresh(
  (reason) => {
    console.debug('[AdminAnalytics] visibility refresh triggered by %s', reason);
    void refreshAnalytics(reason);
  },
  {
    includeActivated: true,
    throttleMs: 500
  }
);

watch(
  analyticsEnabled,
  (enabled) => {
    if (enabled) {
      void refreshAnalytics('feature-enabled');
    }
  },
  { immediate: false }
);

onMounted(() => {
  void refreshAnalytics('mounted');
});

function formatMonth(value: string) {
  if (!value) return '';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return new Intl.DateTimeFormat(localeTag.value, {
      month: 'short',
      year: '2-digit'
    }).format(date);
  } catch (err) {
    console.warn('[AdminAnalytics] failed to format month label', err);
    return value;
  }
}
</script>

<style scoped>
.admin-analytics {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-6);
  width: min(100%, 72rem);
  margin-inline: auto;
}

.admin-analytics__grid {
  display: grid;
  gap: var(--sakai-space-4);
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-xl);
  background: color-mix(in srgb, var(--sakai-primary) 3%, var(--sakai-surface-100));
  border: 0.0625rem solid color-mix(in srgb, var(--sakai-primary) 6%, var(--sakai-border-color));
  box-shadow: var(--sakai-shadow-sm);
}

.admin-analytics__charts {
  display: grid;
  gap: var(--sakai-space-4);
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.admin-analytics__chart-card {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
  height: 100%;
}

.admin-analytics__chart {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: var(--sakai-space-4) var(--sakai-space-2);
  border-radius: var(--sakai-border-radius-lg);
  background: color-mix(in srgb, var(--sakai-surface-alt) 92%, transparent);
  border: 0.0625rem solid color-mix(in srgb, var(--sakai-primary) 6%, var(--sakai-border-color));
}

.admin-analytics__empty {
  margin: 0;
  color: var(--sakai-text-color-tertiary);
  font-size: 0.9rem;
  text-align: center;
  padding: var(--sakai-space-2) 0;
}
</style>