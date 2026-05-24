import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useTeacherProfileStore } from '@/stores/teacherProfile';
import { useTeacherDashboardStore } from '@/stores/teacherDashboard';
import { useTeacherActivityStore } from '@/stores/teacherActivity';
import { useFeaturesStore } from '@/stores/features';
import { useTeacherAssistantsStore } from '@/stores/teacherAssistants';
import { useTeacherUsageStore } from '@/stores/teacherUsage';
import { useTeacherViewsStore } from '@/stores/teacherViews';
import { FEATURE } from '@/constants/featureCatalog';

/**
 * Cross-card refresh state + actions for the teacher dashboard.
 *
 * Centralizes:
 *  - the aggregate `isRefreshing` flag (true while ANY relevant store is
 *    loading OR the manual `assistantsRefreshing` flag is set);
 *  - the `lastUpdated` timestamp (max of all relevant store loadedAt values);
 *  - the locale-aware `lastUpdatedLabel` relative-time string for the toolbar;
 *  - the `assistantsRefreshing` ref (shared between the toolbar's
 *    `isRefreshing` and the Assistants card's manual refresh button);
 *  - the `refreshAll` action (manual full-dashboard refresh fan-out across
 *    profile/dashboard/activity/features/usage/views/assistants stores);
 *  - the `refreshAssistantsSummary` action (Assistants card's retry/refresh).
 *
 * View-level lifecycle hooks (visibility refresh, subscription watcher) keep
 * their own staleness/diff logic; they call store actions directly. This
 * composable owns only the user-triggered manual refresh paths.
 */
export function useTeacherDashboardRefresh() {
  const { t, locale } = useI18n();

  const profileStore = useTeacherProfileStore();
  const dashboardStore = useTeacherDashboardStore();
  const activityStore = useTeacherActivityStore();
  const featuresStore = useFeaturesStore();
  const assistantsStore = useTeacherAssistantsStore();
  const usageStore = useTeacherUsageStore();
  const teacherViewsStore = useTeacherViewsStore();

  const { loading: profileLoading, loadedAt: profileLoadedAt } =
    storeToRefs(profileStore);
  const { loading: overviewLoading, loadedAt: overviewLoadedAt } =
    storeToRefs(dashboardStore);
  const { loading: activityLoading, loadedAt: activityLoadedAt } =
    storeToRefs(activityStore);
  const {
    assistantsLoading: assistantAccountsLoading,
    assistantsLoadedAt: assistantAccountsLoadedAt,
    rolesLoading: assistantRolesLoading,
    rolesLoadedAt: assistantRolesLoadedAt,
  } = storeToRefs(assistantsStore);

  const teacherAssistantsEnabled = computed(() =>
    featuresStore.hasFeature(FEATURE.teacherAssistants),
  );

  const assistantsRefreshing = ref(false);

  const isRefreshing = computed(
    () =>
      profileLoading.value ||
      overviewLoading.value ||
      activityLoading.value ||
      (teacherAssistantsEnabled.value &&
        (assistantAccountsLoading.value ||
          assistantRolesLoading.value ||
          assistantsRefreshing.value)),
  );

  const lastUpdated = computed(() => {
    const timestamps = [
      profileLoadedAt.value,
      overviewLoadedAt.value,
      activityLoadedAt.value,
      teacherAssistantsEnabled.value ? assistantAccountsLoadedAt.value : null,
      teacherAssistantsEnabled.value ? assistantRolesLoadedAt.value : null,
    ].filter((value): value is number => typeof value === 'number');

    if (!timestamps.length) {
      return null;
    }

    return Math.max(...timestamps);
  });

  const localeTag = computed(() => (locale.value === 'ar' ? 'ar-EG' : 'en-US'));

  const relativeTimeFormatter = computed(() => {
    try {
      return new Intl.RelativeTimeFormat(localeTag.value, { numeric: 'auto' });
    } catch (error) {
      console.warn(
        '[useTeacherDashboardRefresh] failed to create relative time formatter',
        error,
      );
      return null;
    }
  });

  const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = timestamp - now;
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const formatter = relativeTimeFormatter.value;

    const formatWithUnit = (
      value: number,
      unit: Intl.RelativeTimeFormatUnit,
      fallbackKey: string,
    ): string => {
      if (formatter) {
        return formatter.format(Math.round(value), unit);
      }
      return t(fallbackKey, { value: Math.abs(Math.round(value)) });
    };

    if (Math.abs(diff) < minute) {
      return t('teacher.relativeTimeJustNow');
    }
    if (Math.abs(diff) < hour) {
      return formatWithUnit(diff / minute, 'minute', 'teacher.relativeTimeMinutes');
    }
    if (Math.abs(diff) < day) {
      return formatWithUnit(diff / hour, 'hour', 'teacher.relativeTimeHours');
    }
    return formatWithUnit(diff / day, 'day', 'teacher.relativeTimeDays');
  };

  const lastUpdatedLabel = computed(() => {
    if (!lastUpdated.value) {
      return '';
    }
    return t('teacher.lastUpdated', {
      value: formatRelativeTime(lastUpdated.value),
    });
  });

  const refreshAll = async (): Promise<void> => {
    const featureRefresh = featuresStore.refresh().catch((error) => {
      console.error(
        '[useTeacherDashboardRefresh] failed to refresh features during manual refresh',
        error,
      );
    });
    const tasks: Promise<unknown>[] = [
      profileStore.load(true),
      activityStore.load(true),
      featureRefresh.then(() => dashboardStore.loadOverview(true)),
      usageStore.loadSummary(true),
      usageStore.loadTrends(true),
      teacherViewsStore.loadSummary(),
    ];

    if (teacherAssistantsEnabled.value) {
      tasks.push(assistantsStore.refreshAll());
    }

    await Promise.allSettled(tasks);
  };

  const refreshAssistantsSummary = async (): Promise<void> => {
    if (!teacherAssistantsEnabled.value || assistantsRefreshing.value) {
      return;
    }
    assistantsRefreshing.value = true;
    try {
      await assistantsStore.refreshAll();
    } finally {
      assistantsRefreshing.value = false;
    }
  };

  return {
    isRefreshing,
    lastUpdated,
    lastUpdatedLabel,
    assistantsRefreshing,
    refreshAll,
    refreshAssistantsSummary,
  };
}
