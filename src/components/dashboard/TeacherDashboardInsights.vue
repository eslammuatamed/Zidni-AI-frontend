<template>
  <div
    class="teacher-dashboard__insights bg-gradient-brand-soft text-white rounded-[14px] p-6 [border:1px_solid_rgb(255_255_255_/_0.1)] flex flex-col gap-4"
  >
    <div class="flex flex-col gap-1">
      <h2 class="text-white text-base font-bold m-0">
        {{ t("teacher.insightsTitle") }}
      </h2>
      <p class="text-white/80 text-sm m-0">
        {{ t("teacher.insightsSubtitle") }}
      </p>
    </div>
    <div class="flex flex-wrap gap-5 items-center justify-between">
      <div class="flex items-center gap-4">
        <UiProgressCircle
          :value="profileCompleteness"
          :size="112"
          color="primary"
          ring-color="var(--sakai-primary-300)"
          track-color="rgba(255, 255, 255, 0.15)"
        >
          <span class="text-white">{{ profileCompleteness }}%</span>
        </UiProgressCircle>
        <div class="flex flex-col gap-2">
          <span class="text-[0.85rem] text-white/70 uppercase tracking-[0.08em]">
            {{ t("teacher.profileCompleteness") }}
          </span>
          <span class="text-[1.75rem] font-semibold text-white">
            {{ profileCompleteness }}%
          </span>
        </div>
      </div>
      <div v-if="showMetricsSkeleton" class="flex-[1_1_200px]">
        <UiSkeleton height="72px" />
      </div>
      <div v-else class="flex-[1_1_200px]">
        <TheLineChart
          :data="chartSeries"
          :categories="chartCategories"
          surface="dark"
          variant="sparkline"
          :height="120"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useTeacherProfileStore } from "@/stores/teacherProfile";
import { useTeacherDashboardStore } from "@/stores/teacherDashboard";
import { useTeacherTranslations } from "@/composables/useTeacherTranslations";
import TheLineChart, {
  type ChartSeries,
} from "@/components/dashboard/TheLineChart.vue";
import UiProgressCircle from "@/components/ui/UiProgressCircle.vue";
import UiSkeleton from "@/components/ui/UiSkeleton.vue";

const { t } = useTeacherTranslations();

const profileStore = useTeacherProfileStore();
const dashboardStore = useTeacherDashboardStore();

const { profile, loading: profileLoading, profileCompleteness } =
  storeToRefs(profileStore);
const { overview, loading: overviewLoading } = storeToRefs(dashboardStore);

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

const sparklineData = computed(() => {
  const metrics = overview.value;
  const completion =
    (metrics?.completionRate ?? 0) || profileCompleteness.value;
  const activeStudents = metrics?.activeStudents ?? 0;
  const totalEnrollments = metrics?.totalEnrollments ?? 0;

  if (!metrics || (!activeStudents && !totalEnrollments)) {
    const fallback = profileCompleteness.value;
    const floor = Math.max(10, fallback - 25);
    const mid = Math.max(20, fallback - 10);
    const high = Math.min(100, fallback + 12);
    return [floor, mid, fallback, high];
  }

  const baseline = Math.max(
    0,
    activeStudents - Math.round(totalEnrollments / 3),
  );
  const mid = Math.max(baseline, activeStudents);
  const growth = mid + Math.max(1, Math.round(totalEnrollments / 2));
  const completionPoint = Math.max(
    growth,
    Math.round(((completion || 0) / 100) * Math.max(1, mid + totalEnrollments)),
  );

  return [baseline, mid, growth, completionPoint];
});

const chartSeries = computed<ChartSeries[]>(() => [
  { name: t("teacher.insightsTitle"), data: sparklineData.value },
]);

const chartCategories = ["", "", "", ""];
</script>
