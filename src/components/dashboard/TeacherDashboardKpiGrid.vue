<template>
  <div
    class="teacher-dashboard__metrics grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
  >
    <template v-if="showMetricsSkeleton">
      <UiCard
        v-for="index in 6"
        :key="`metrics-skeleton-${index}`"
        class="teacher-dashboard__metric-skeleton flex flex-col justify-between gap-4 p-5"
      >
        <div class="flex items-center justify-between gap-3">
          <UiSkeleton height="2rem" width="2rem" />
          <UiSkeleton height="0.9rem" width="50%" />
        </div>
        <UiSkeleton height="1.75rem" width="40%" />
      </UiCard>
    </template>
    <template v-else>
      <KpiMetricCard
        :label="t('teacher.profileCompleteness')"
        :value="`${profileCompleteness}%`"
        icon="DashboardOutlined"
        tone="primary"
      />
      <KpiMetricCard
        :label="t('teacher.activeStudents')"
        :value="formatNumber(safeOverview.activeStudents ?? 0)"
        icon="UserSwitchOutlined"
        tone="info"
      />
      <KpiMetricCard
        :label="t('teacher.newEnrollments')"
        :value="formatNumber(safeOverview.totalEnrollments ?? 0)"
        icon="TeamOutlined"
        tone="success"
      />
      <KpiMetricCard
        :label="t('teacher.completionRate')"
        :value="formatPercent(safeOverview.completionRate ?? 0)"
        icon="PieChartOutlined"
        tone="warning"
      />
      <KpiMetricCard
        :label="t('teacher.paymentMethodsConfigured')"
        :value="formatNumber(paymentMethodsCount)"
        icon="CreditCardOutlined"
        :tone="paymentMethodsTone"
      />
      <KpiMetricCard
        :label="t('teacher.totalViews')"
        :value="formatNumber(viewsSummary?.totalViews ?? 0)"
        icon="EyeOutlined"
        tone="primary"
      />
      <UiAlert
        v-if="showPaymentMethodsWarning"
        class="teacher-dashboard__payments-warning col-span-full"
        color="warning"
        variant="soft"
      >
        {{ t("teacher.paymentMethodsConfiguredWarning") }}
      </UiAlert>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useTeacherProfileStore } from "@/stores/teacherProfile";
import { useTeacherDashboardStore } from "@/stores/teacherDashboard";
import { useFeaturesStore } from "@/stores/features";
import { useTeacherViewsStore } from "@/stores/teacherViews";
import { useTeacherTranslations } from "@/composables/useTeacherTranslations";
import { formatNumber, formatPercent } from "@/utils/formatNumber";
import { FEATURE } from "@/constants/featureCatalog";
import UiCard from "@/components/ui/UiCard.vue";
import UiSkeleton from "@/components/ui/UiSkeleton.vue";
import UiAlert from "@/components/ui/UiAlert.vue";
import KpiMetricCard from "@/components/dashboard/KpiMetricCard.vue";

const { t } = useTeacherTranslations();

const profileStore = useTeacherProfileStore();
const dashboardStore = useTeacherDashboardStore();
const featuresStore = useFeaturesStore();
const teacherViewsStore = useTeacherViewsStore();

const { profile, loading: profileLoading, profileCompleteness } =
  storeToRefs(profileStore);
const { overview, loading: overviewLoading } = storeToRefs(dashboardStore);
const { summary: viewsSummary } = storeToRefs(teacherViewsStore);

const overviewFallback = {
  totalEnrollments: 0,
  activeStudents: 0,
  revenueManual: 0,
  revenueTutoring: 0,
  avgCourseRating: 0,
  completionRate: 0,
  paymentMethodCount: 0,
};

const safeOverview = computed(() => overview.value ?? overviewFallback);

const isProfilePending = computed(
  () => profileLoading.value && !profile.value,
);
const isOverviewPending = computed(
  () => overviewLoading.value && !overview.value,
);
const showMetricsSkeleton = computed(
  () =>
    (isProfilePending.value && !profile.value) ||
    (isOverviewPending.value && !overview.value),
);

const teacherReportsEnabled = computed(() =>
  featuresStore.hasFeature(FEATURE.reportsTeacher),
);

const paymentMethodsCount = computed(
  () => safeOverview.value.paymentMethodCount ?? 0,
);
const paymentMethodsTone = computed(() =>
  paymentMethodsCount.value === 0 ? "danger" : "primary",
);
const showPaymentMethodsWarning = computed(
  () =>
    paymentMethodsCount.value === 0 &&
    !showMetricsSkeleton.value &&
    teacherReportsEnabled.value &&
    !overviewLoading.value,
);
</script>
