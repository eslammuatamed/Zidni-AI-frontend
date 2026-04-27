<template>
  <ThemePage :title="t('reports.overview.title')" :subtitle="t('reports.overview.subtitle')">
    <template #actions>
      <UiButton
        variant="outline"
        color="secondary"
        prepend-icon="FileTextOutlined"
        :to="{ name: 'teacher-reports-history' }"
      >
        {{ t('reports.requestTitle') }}
      </UiButton>
    </template>

    <section class="teacher-reports-overview">
      <UiCard class="teacher-reports-overview__filters" hover>
        <header class="teacher-reports-overview__filters-header">
          <h2>{{ t('reports.overview.filters.title') }}</h2>
          <p>{{ t('reports.overview.filters.caption') }}</p>
        </header>
        <div class="teacher-reports-overview__filters-grid">
          <UiInput
            v-model="filters.from"
            type="date"
            :label="t('reports.overview.filters.from')"
          />
          <UiInput
            v-model="filters.to"
            type="date"
            :label="t('reports.overview.filters.to')"
          />
          <div class="teacher-reports-overview__filters-actions">
            <UiButton
              variant="link"
              color="secondary"
              prepend-icon="ReloadOutlined"
              :disabled="loading"
              @click="resetRange"
            >
              {{ t('reports.overview.filters.reset') }}
            </UiButton>
            <UiButton
              prepend-icon="LineChartOutlined"
              :disabled="loading"
              @click="refreshOverview"
            >
              {{ t('reports.overview.filters.apply') }}
            </UiButton>
          </div>
        </div>
      </UiCard>

      <UiAlert v-if="error" color="danger" variant="soft">
        {{ error }}
      </UiAlert>

      <div class="teacher-reports-overview__grid">
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
    </section>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import ThemePage from '@/layout/theme/ThemePage.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiStatCard from '@/components/ui/UiStatCard.vue';
import {
  getOverview,
  type TeacherReportsOverviewParams,
  type TeacherReportsOverviewResponse
} from '@/api/reportsTeacher';

interface Filters {
  from: string;
  to: string;
}

interface StatCard {
  key: string;
  label: string;
  value: string | number;
  icon: string;
  color: 'primary' | 'info' | 'success' | 'warning' | 'danger';
}

const { t, locale } = useI18n();

const loading = ref(true);
const error = ref('');
const initialized = ref(false);
const overview = ref<TeacherReportsOverviewResponse>({
  totalEnrollments: 0,
  activeStudents: 0,
  revenueManual: 0,
  revenueTutoring: 0,
  avgCourseRating: 0,
  completionRate: 0
});

const today = new Date();
const defaultFrom = new Date();
defaultFrom.setDate(today.getDate() - 30);

const filters = reactive<Filters>({
  from: formatInputDate(defaultFrom),
  to: formatInputDate(today)
});

const localeTag = computed(() => (locale.value === 'ar' ? 'ar-EG' : 'en-US'));

const cards = computed<StatCard[]>(() => {
  const current = overview.value;
  const stats: StatCard[] = [
    {
      key: 'totalEnrollments',
      label: t('reports.overview.kpis.totalEnrollments'),
      value: formatNumber(current.totalEnrollments),
      icon: 'TeamOutlined',
      color: 'primary'
    },
    {
      key: 'activeStudents',
      label: t('reports.overview.kpis.activeStudents'),
      value: formatNumber(current.activeStudents),
      icon: 'UserSwitchOutlined',
      color: 'info'
    },
    {
      key: 'revenueManual',
      label: t('reports.overview.kpis.revenueManual'),
      value: formatCurrency(current.revenueManual),
      icon: 'DollarOutlined',
      color: 'success'
    },
    {
      key: 'revenueTutoring',
      label: t('reports.overview.kpis.revenueTutoring'),
      value: formatCurrency(current.revenueTutoring),
      icon: 'SolutionOutlined',
      color: 'success'
    },
    {
      key: 'avgCourseRating',
      label: t('reports.overview.kpis.avgCourseRating'),
      value: formatRating(current.avgCourseRating),
      icon: 'StarOutlined',
      color: 'warning'
    },
    {
      key: 'completionRate',
      label: t('reports.overview.kpis.completionRate'),
      value: formatPercent(current.completionRate),
      icon: 'PieChartOutlined',
      color: 'info'
    }
  ];

  if (!initialized.value || loading.value) {
    return stats.map((card) => ({ ...card, value: '…' }));
  }

  return stats;
});

function formatInputDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function formatNumber(value: number) {
  const safeValue = Number.isFinite(value) ? value : 0;
  try {
    return new Intl.NumberFormat(localeTag.value).format(safeValue);
  } catch (error) {
    console.warn('[TeacherReportsOverview] failed to format number', error);
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
  } catch (error) {
    console.warn('[TeacherReportsOverview] failed to format currency', error);
    return `EGP ${safeValue.toFixed(2)}`;
  }
}

function formatRating(value: number) {
  const safeValue = Number.isFinite(value) ? value : 0;
  return safeValue.toFixed(1);
}

function formatPercent(value: number) {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `${Math.round(safeValue)}%`;
}

function resetRange() {
  const now = new Date();
  const from = new Date();
  from.setDate(now.getDate() - 30);
  filters.from = formatInputDate(from);
  filters.to = formatInputDate(now);
}

async function refreshOverview() {
  error.value = '';
  if (filters.from && filters.to) {
    const fromDate = new Date(filters.from);
    const toDate = new Date(filters.to);
    if (fromDate > toDate) {
      error.value = t('reports.overview.invalidRange');
      return;
    }
  }

  loading.value = true;
  try {
    const params: TeacherReportsOverviewParams = {};
    if (filters.from) {
      params.from = filters.from;
    }
    if (filters.to) {
      params.to = filters.to;
    }
    const data = await getOverview(params);
    overview.value = {
      totalEnrollments: data.totalEnrollments ?? 0,
      activeStudents: data.activeStudents ?? 0,
      revenueManual: data.revenueManual ?? 0,
      revenueTutoring: data.revenueTutoring ?? 0,
      avgCourseRating: data.avgCourseRating ?? 0,
      completionRate: data.completionRate ?? 0
    };
    initialized.value = true;
  } catch (err) {
    console.error('[TeacherReportsOverview] failed to load overview', err);
    error.value = t('reports.overview.loadFailed');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  refreshOverview();
});
</script>

<style scoped>
.teacher-reports-overview {
  display: grid;
  gap: var(--sakai-space-6);
}

.teacher-reports-overview__filters {
  display: grid;
  gap: var(--sakai-space-5);
}

.teacher-reports-overview__filters-header {
  display: grid;
  gap: var(--sakai-space-2);
}

.teacher-reports-overview__filters-header h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.teacher-reports-overview__filters-header p {
  margin: 0;
  color: var(--sakai-text-color-tertiary);
  font-size: 0.9rem;
}

.teacher-reports-overview__filters-grid {
  display: grid;
  gap: var(--sakai-space-4);
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  align-items: end;
}

.teacher-reports-overview__filters-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--sakai-space-3);
}

.teacher-reports-overview__grid {
  display: grid;
  gap: var(--sakai-space-4);
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}
</style>
