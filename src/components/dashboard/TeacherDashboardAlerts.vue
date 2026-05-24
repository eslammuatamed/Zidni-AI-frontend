<template>
  <div
    v-if="profileError || overviewError || activityError"
    class="teacher-dashboard__alerts flex flex-col gap-3"
    role="status"
  >
    <UiAlert
      v-if="profileError"
      class="teacher-dashboard__alert"
      color="danger"
      variant="soft"
    >
      <div
        class="teacher-dashboard__alert-content flex items-center justify-between gap-3 flex-wrap"
      >
        <span>{{ t("teacher.profileLoadError") }}</span>
        <UiButton
          size="sm"
          variant="link"
          color="danger"
          @click="reloadProfile"
        >
          {{ t("teacher.retryAction") }}
        </UiButton>
      </div>
    </UiAlert>
    <UiAlert
      v-if="overviewError"
      class="teacher-dashboard__alert"
      color="warning"
      variant="soft"
    >
      <div
        class="teacher-dashboard__alert-content flex items-center justify-between gap-3 flex-wrap"
      >
        <span>{{ t("teacher.metricsLoadError") }}</span>
        <UiButton
          size="sm"
          variant="link"
          color="warning"
          @click="void reloadMetrics()"
        >
          {{ t("teacher.retryAction") }}
        </UiButton>
      </div>
    </UiAlert>
    <UiAlert
      v-if="activityError"
      class="teacher-dashboard__alert"
      color="info"
      variant="soft"
    >
      <div
        class="teacher-dashboard__alert-content flex items-center justify-between gap-3 flex-wrap"
      >
        <span>{{ t("teacher.activityLoadError") }}</span>
        <UiButton
          size="sm"
          variant="link"
          color="info"
          @click="reloadActivity"
        >
          {{ t("teacher.retryAction") }}
        </UiButton>
      </div>
    </UiAlert>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useTeacherProfileStore } from "@/stores/teacherProfile";
import { useTeacherDashboardStore } from "@/stores/teacherDashboard";
import { useTeacherActivityStore } from "@/stores/teacherActivity";
import { useFeaturesStore } from "@/stores/features";
import { useTeacherTranslations } from "@/composables/useTeacherTranslations";
import UiAlert from "@/components/ui/UiAlert.vue";
import UiButton from "@/components/ui/UiButton.vue";

const { t } = useTeacherTranslations();

const profileStore = useTeacherProfileStore();
const dashboardStore = useTeacherDashboardStore();
const activityStore = useTeacherActivityStore();
const featuresStore = useFeaturesStore();

const { error: profileError } = storeToRefs(profileStore);
const { error: overviewError } = storeToRefs(dashboardStore);
const { error: activityError } = storeToRefs(activityStore);

const reloadProfile = () => {
  void profileStore.load(true);
};

const reloadMetrics = async () => {
  try {
    await featuresStore.ensureLoaded();
  } catch (error) {
    console.warn(
      "[TeacherDashboardAlerts] failed to ensure feature snapshot before reloading metrics",
      error,
    );
  }
  return dashboardStore.loadOverview(true);
};

const reloadActivity = () => {
  void activityStore.load(true);
};
</script>
