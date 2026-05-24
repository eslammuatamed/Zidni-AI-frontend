<!--
  TeacherDashboardView.vue presents the teacher-facing home dashboard with
  progress insights, quick navigation, and onboarding tasks. It now consumes
  shared Pinia stores to cache the teacher profile and dashboard metrics while
  surfacing inline loading, error, and contextual guidance states.
-->
<template>
  <ThemePage>
    <div class="teacher-dashboard flex flex-col gap-6">
      <TeacherDashboardAlerts />

      <TeacherDashboardToolbar />

      <TeacherDashboardGreeting />

      <TeacherDashboardKpiGrid />

      <div class="grid grid-cols-1 md:grid-cols-12 gap-5">
        <TeacherDashboardNextSteps />
        <div class="md:col-span-6 lg:col-span-4 flex flex-col gap-5">
          <TeacherDashboardInsights />
          <TeacherDashboardAssistants />
        </div>

        <TeacherDashboardPlanUsage />

        <TeacherDashboardTopCourses />

        <TeacherDashboardActivity />
      </div>

    </div>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import {
  useTeacherProfileStore,
  type TeacherProfileMissingField,
} from "@/stores/teacherProfile";
import { useTeacherDashboardStore } from "@/stores/teacherDashboard";
import { useTeacherActivityStore } from "@/stores/teacherActivity";
import { useFeaturesStore } from "@/stores/features";
import { useTeacherAssistantsStore } from "@/stores/teacherAssistants";
import { useSubscriptionStore } from "@/stores/subscription";
import { useTeacherUsageStore } from "@/stores/teacherUsage";
import { useTeacherViewsStore } from "@/stores/teacherViews";
import { useVisibilityRefresh } from "@/composables/useVisibilityRefresh";
import { FEATURE } from "@/constants/featureCatalog";
import TeacherDashboardAlerts from "@/components/dashboard/TeacherDashboardAlerts.vue";
import TeacherDashboardGreeting from "@/components/dashboard/TeacherDashboardGreeting.vue";
import TeacherDashboardToolbar from "@/components/dashboard/TeacherDashboardToolbar.vue";
import TeacherDashboardKpiGrid from "@/components/dashboard/TeacherDashboardKpiGrid.vue";
import TeacherDashboardTopCourses from "@/components/dashboard/TeacherDashboardTopCourses.vue";
import TeacherDashboardActivity from "@/components/dashboard/TeacherDashboardActivity.vue";
import TeacherDashboardInsights from "@/components/dashboard/TeacherDashboardInsights.vue";
import TeacherDashboardAssistants from "@/components/dashboard/TeacherDashboardAssistants.vue";
import TeacherDashboardPlanUsage from "@/components/dashboard/TeacherDashboardPlanUsage.vue";
import TeacherDashboardNextSteps from "@/components/dashboard/TeacherDashboardNextSteps.vue";

const profileStore = useTeacherProfileStore();
const dashboardStore = useTeacherDashboardStore();
const activityStore = useTeacherActivityStore();
const featuresStore = useFeaturesStore();
const assistantsStore = useTeacherAssistantsStore();
const subscriptionStore = useSubscriptionStore();
const usageStore = useTeacherUsageStore();
const teacherViewsStore = useTeacherViewsStore();

const teacherAssistantsEnabled = computed(() =>
  featuresStore.hasFeature(FEATURE.teacherAssistants),
);
const {
  roles: assistantRoles,
  rolesLoading: assistantRolesLoading,
  rolesError: assistantRolesError,
  rolesLoadedAt: assistantRolesLoadedAt,
  assistants: assistantAccounts,
  assistantsLoading: assistantAccountsLoading,
  assistantsError: assistantAccountsError,
  assistantsLoadedAt: assistantAccountsLoadedAt,
} = storeToRefs(assistantsStore);
const { summary: subscriptionSummary } = storeToRefs(subscriptionStore);
const {
  summary: viewsSummary,
  loading: viewsLoading,
  error: viewsError,
} = storeToRefs(teacherViewsStore);

const lastSubscriptionSignature = ref<string | null>(null);
const subscriptionRefreshInFlight = ref(false);

const STALE_RELOAD_LEEWAY = 10 * 1000;

const refreshIfStale = async () => {
  if (profileStore.isCacheStale(STALE_RELOAD_LEEWAY)) {
    void profileStore.load(true);
  }
  if (dashboardStore.isCacheStale(STALE_RELOAD_LEEWAY)) {
    try {
      await featuresStore.ensureLoaded();
    } catch (error) {
      console.warn(
        "[TeacherDashboardView] failed to ensure feature snapshot while refreshing",
        error,
      );
    }
    void dashboardStore.loadOverview(true);
  }
  if (activityStore.isCacheStale(STALE_RELOAD_LEEWAY)) {
    void activityStore.load(true);
  }
  void subscriptionStore.loadSubscription(true);
  void usageStore.loadSummary();
  void usageStore.loadTrends();
  void teacherViewsStore.loadSummary();
  if (!dashboardStore.isCacheStale(STALE_RELOAD_LEEWAY)) {
    void featuresStore.ensureLoaded().catch((error) => {
      console.warn(
        "[TeacherDashboardView] failed to ensure feature snapshot while refreshing",
        error,
      );
    });
  }
  if (teacherAssistantsEnabled.value) {
    if (!assistantsStore.isRolesCacheFresh()) {
      void assistantsStore.loadRoles(true);
    }
    if (!assistantsStore.isAssistantsCacheFresh()) {
      void assistantsStore.loadAssistants(true);
    }
  }
};

const buildSubscriptionSignature = (summary: unknown) => {
  const current = (
    summary as {
      currentSubscription?: {
        id?: number | string;
        status?: string;
        endsAt?: string | null;
      } | null;
    }
  )?.currentSubscription;
  if (!current) {
    return "none";
  }
  const id = current.id ?? "none";
  const status = current.status ?? "unknown";
  const endsAt = current.endsAt ?? "none";
  return `${id}:${status}:${endsAt}`;
};

const refreshAfterSubscriptionChange = async (reason: string) => {
  if (subscriptionRefreshInFlight.value) {
    return;
  }
  subscriptionRefreshInFlight.value = true;
  try {
    console.info(
      "[TeacherDashboardView] refreshing dashboard after subscription change (%s)",
      reason,
    );
    const featureRefresh = featuresStore.refresh().catch((error) => {
      console.error(
        "[TeacherDashboardView] failed to refresh feature snapshot after subscription update",
        error,
      );
    });
    const tasks: Promise<unknown>[] = [
      profileStore.load(true),
      activityStore.load(true),
      featureRefresh.then(() => dashboardStore.loadOverview(true)),
      usageStore.loadSummary(true),
      usageStore.loadTrends(true),
    ];
    if (teacherAssistantsEnabled.value) {
      tasks.push(assistantsStore.refreshAll());
    }
    await Promise.allSettled(tasks);
  } finally {
    subscriptionRefreshInFlight.value = false;
  }
};

watch(
  teacherAssistantsEnabled,
  (enabled) => {
    if (!enabled) {
      return;
    }
    void assistantsStore.loadRoles();
    void assistantsStore.loadAssistants();
  },
  { immediate: true },
);

watch(
  subscriptionSummary,
  (summary) => {
    const signature = buildSubscriptionSignature(summary);
    if (lastSubscriptionSignature.value === null) {
      lastSubscriptionSignature.value = signature;
      return;
    }
    if (signature === lastSubscriptionSignature.value) {
      return;
    }
    lastSubscriptionSignature.value = signature;
    void refreshAfterSubscriptionChange("summary-updated");
  },
  { deep: true },
);

onMounted(async () => {
  try {
    await featuresStore.ensureLoaded();
  } catch (error) {
    console.warn(
      "[TeacherDashboardView] failed to ensure feature snapshot on mount",
      error,
    );
  }
  void profileStore.load();
  void dashboardStore.loadOverview();
  void activityStore.load();
  void subscriptionStore.loadSubscription();
  void usageStore.loadSummary();
  void usageStore.loadTrends();
  void teacherViewsStore.loadSummary();
  teacherViewsStore.connect();
});

onUnmounted(() => {
  teacherViewsStore.disconnect();
});

useVisibilityRefresh(
  (reason) => {
    console.debug(
      "[TeacherDashboardView] visibility refresh triggered by %s",
      reason,
    );
    void refreshIfStale();
    void subscriptionStore.loadSubscription(true);
  },
  {
    includeActivated: true,
    throttleMs: 500,
  },
);

</script>

<style scoped>
/* Metrics grid breakpoints are handled by Tailwind responsive utilities
   (grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4) on the
   wrapper itself. The earlier scoped media queries were redundant. */


/* ── Account row — last-child pseudo-selector ───────────────────────── */
.teacher-dashboard__account-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

/* ── Account card — top accent border ──────────────────────────────── */
.teacher-dashboard__account {
  border-top: 3px solid var(--sakai-primary);
}

/* ── Account label — small uppercase ───────────────────────────────── */
.teacher-dashboard__account-label {
  font-size: 0.8rem;
  color: var(--sakai-text-color-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* ── Account value muted variant ───────────────────────────────────── */
.teacher-dashboard__account-value--muted {
  color: var(--sakai-text-color-tertiary);
}

/* ── Responsive content grid ────────────────────────────────────────── */
/* @media (max-width: 960px) {
  .teacher-dashboard__content {
    grid-template-columns: 1fr;
  }

  .teacher-dashboard__views,
  .teacher-dashboard__activity,
  .teacher-dashboard__plan-usage,
  .teacher-dashboard__insights,
  .teacher-dashboard__next,
  .teacher-dashboard__assistants-card {
    grid-column: 1;
    grid-row: auto;
  }

  .teacher-dashboard__alert-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .teacher-dashboard__toolbar {
    justify-content: space-between;
  }
} */
</style>
