<template>
  <UiCard
    class="md:col-span-6 lg:col-span-8"
    :title="t('teacher.nextStepsTitle')"
    :subtitle="t('teacher.nextStepsSubtitle')"
    hover
  >
    <ul
      class="teacher-dashboard__steps list-none m-0 p-0 flex flex-col divide-y divide-border/40"
    >
      <li
        v-for="step in nextSteps"
        :key="step.id"
        class="teacher-dashboard__step group flex items-start gap-3 py-3 first:pt-0 last:pb-0 -mx-2 px-2 rounded transition-colors hover:bg-content-tertiary/5"
      >
        <span
          class="inline-flex items-center justify-center h-8 w-8 rounded-md bg-content-tertiary/10 text-content-secondary shrink-0"
          aria-hidden="true"
        >
          <UiIcon :name="step.icon" :size="16" />
        </span>
        <div class="flex-1 min-w-0 flex flex-col gap-0.5">
          <span
            class="font-medium text-content truncate"
            :title="step.title"
          >
            {{ step.title }}
          </span>
          <span
            v-if="step.description"
            class="block text-content-tertiary text-[0.85rem]"
          >
            {{ step.description }}
          </span>
        </div>
        <UiButton
          v-if="step.action"
          size="sm"
          variant="link"
          color="primary"
          @click="step.action()"
        >
          {{ t("teacher.goToAction") }}
        </UiButton>
      </li>
    </ul>
  </UiCard>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import {
  useTeacherProfileStore,
  type TeacherProfileMissingField,
} from "@/stores/teacherProfile";
import { useTeacherDashboardStore } from "@/stores/teacherDashboard";
import { useTeacherActivityStore } from "@/stores/teacherActivity";
import { useFeaturesStore } from "@/stores/features";
import { useTeacherAssistantsStore } from "@/stores/teacherAssistants";
import { FEATURE } from "@/constants/featureCatalog";
import { useTeacherTranslations } from "@/composables/useTeacherTranslations";
import { useTeacherDashboardActions } from "@/composables/useTeacherDashboardActions";
import UiCard from "@/components/ui/UiCard.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiIcon from "@/components/ui/UiIcon.vue";

interface NextStep {
  id: string;
  title: string;
  description?: string;
  icon: string;
  action?: () => void;
}

const { t } = useTeacherTranslations();
const {
  goToBranding,
  goToReports,
  goToLiveSessions,
  goToLearning,
  goToAssistantTeam,
} = useTeacherDashboardActions();

const router = useRouter();
const auth = useAuthStore();

const profileStore = useTeacherProfileStore();
const dashboardStore = useTeacherDashboardStore();
const activityStore = useTeacherActivityStore();
const featuresStore = useFeaturesStore();
const assistantsStore = useTeacherAssistantsStore();

const { missingFields } = storeToRefs(profileStore);
const { overview } = storeToRefs(dashboardStore);
const { upcomingAssignments } = storeToRefs(activityStore);
const {
  assistants: assistantAccounts,
  assistantsLoading: assistantAccountsLoading,
  assistantsError: assistantAccountsError,
  rolesLoading: assistantRolesLoading,
  rolesError: assistantRolesError,
} = storeToRefs(assistantsStore);

const teacherReportsEnabled = computed(() =>
  featuresStore.hasFeature(FEATURE.reportsTeacher),
);
const liveSessionsEnabled = computed(() =>
  featuresStore.hasFeature(FEATURE.liveSessionsCore),
);
const teacherAssistantsEnabled = computed(() =>
  featuresStore.hasFeature(FEATURE.teacherAssistants),
);

const assistantCount = computed(() => assistantAccounts.value.length);
const assistantsSummaryLoading = computed(
  () => assistantAccountsLoading.value || assistantRolesLoading.value,
);
const assistantsSummaryError = computed(() =>
  Boolean(assistantAccountsError.value || assistantRolesError.value),
);

const nextSteps = computed<NextStep[]>(() => {
  const steps: NextStep[] = [];
  const missing = missingFields.value;

  const pushProfileStep = (
    field: TeacherProfileMissingField,
    id: string,
    titleKey: string,
    hintKey: string,
    icon: string,
  ) => {
    if (!missing.includes(field)) {
      return;
    }
    steps.push({
      id,
      title: t(titleKey),
      description: t(hintKey),
      icon,
      action: goToBranding,
    });
  };

  pushProfileStep(
    "bio",
    "complete-bio",
    "teacher.nextStepsCompleteBio",
    "teacher.nextStepsCompleteBioHint",
    "IdcardOutlined",
  );
  pushProfileStep(
    "subject",
    "complete-subject",
    "teacher.nextStepsCompleteSubject",
    "teacher.nextStepsCompleteSubjectHint",
    "BookOutlined",
  );
  pushProfileStep(
    "photoUrl",
    "upload-photo",
    "teacher.nextStepsUploadPhoto",
    "teacher.nextStepsUploadPhotoHint",
    "CameraOutlined",
  );

  if (
    overview.value &&
    overview.value.completionRate < 70 &&
    teacherReportsEnabled.value
  ) {
    steps.push({
      id: "review-reports",
      title: t("teacher.nextStepsReviewReports"),
      description: t("teacher.nextStepsReviewReportsHint"),
      icon: "BarChartOutlined",
      action: goToReports,
    });
  }

  if (
    liveSessionsEnabled.value &&
    overview.value &&
    (overview.value.activeStudents < 5 || overview.value.totalEnrollments < 5)
  ) {
    steps.push({
      id: "launch-live-session",
      title: t("teacher.nextStepsLaunchLiveSession"),
      description: t("teacher.nextStepsLaunchLiveSessionHint"),
      icon: "VideoCameraAddOutlined",
      action: goToLiveSessions,
    });
  }

  if (!upcomingAssignments.value.length) {
    steps.push({
      id: "create-assignment",
      title: t("teacher.nextStepsCreateAssignment"),
      description: t("teacher.nextStepsCreateAssignmentHint"),
      icon: "ReadOutlined",
      action: goToLearning,
    });
  }

  steps.push({
    id: "invite-students",
    title: t("teacher.nextStepsInvite"),
    description: t("teacher.nextStepsInviteHint"),
    icon: "UserAddOutlined",
    action: () =>
      router.push({
        name: auth.isTeacher ? "teacher-enrollments" : "student-register",
      }),
  });

  if (
    teacherAssistantsEnabled.value &&
    !assistantsSummaryLoading.value &&
    !assistantsSummaryError.value &&
    assistantCount.value === 0
  ) {
    steps.push({
      id: "invite-assistant",
      title: t("teacher.nextStepsInviteAssistant"),
      description: t("teacher.nextStepsInviteAssistantHint"),
      icon: "UserSwitchOutlined",
      action: goToAssistantTeam,
    });
  }

  const evergreen: NextStep[] = [
    {
      id: "branding",
      title: t("teacher.nextStepsBranding"),
      description: t("teacher.nextStepsBrandingHint"),
      icon: "PaletteOutlined",
      action: goToBranding,
    },
    {
      id: "welcome",
      title: t("teacher.nextStepsWelcome"),
      description: t("teacher.nextStepsWelcomeHint"),
      icon: "AlignLeftOutlined",
      action: goToBranding,
    },
  ];

  const unique: NextStep[] = [];
  const seen = new Set<string>();

  for (const step of [...steps, ...evergreen]) {
    if (seen.has(step.id)) {
      continue;
    }
    seen.add(step.id);
    unique.push(step);
    if (unique.length >= 4) {
      break;
    }
  }

  return unique;
});
</script>
