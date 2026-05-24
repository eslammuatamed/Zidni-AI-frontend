<template>
  <UiCard
    v-if="teacherAssistantsEnabled"
    class="flex flex-col gap-5"
    :title="t('teacher.assistantsDashboard.title')"
    :subtitle="t('teacher.assistantsDashboard.subtitle')"
    hover
  >
    <div
      v-if="assistantsSummaryLoading"
      class="flex flex-col gap-5"
    >
      <div
        class="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(140px,1fr))]"
      >
        <div
          v-for="i in 2"
          :key="`assistants-stat-skel-${i}`"
          class="flex flex-col gap-2"
        >
          <UiSkeleton height="2rem" width="40%" />
          <UiSkeleton height="0.75rem" width="55%" />
        </div>
      </div>
      <div class="flex flex-wrap gap-3">
        <UiSkeleton
          v-for="i in 3"
          :key="`assistants-btn-skel-${i}`"
          height="2rem"
          width="8rem"
        />
      </div>
    </div>
    <template v-else>
      <UiAlert
        v-if="assistantsSummaryError"
        color="warning"
        variant="soft"
      >
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <span>{{ t("teacher.assistantsDashboard.loadError") }}</span>
          <UiButton
            size="sm"
            variant="link"
            color="warning"
            :disabled="assistantsRefreshing"
            @click="refreshAssistantsSummary"
          >
            {{ t("teacher.assistantsDashboard.refresh") }}
          </UiButton>
        </div>
      </UiAlert>
      <div
        v-else-if="assistantCount > 0 || assistantRoleCount > 0"
        class="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(140px,1fr))]"
      >
        <div class="flex flex-col gap-1">
          <span
            class="text-2xl font-semibold text-content-strong tabular-nums"
          >
            {{ formatNumber(assistantCount) }}
          </span>
          <span
            class="text-[0.75rem] uppercase tracking-[0.08em] text-content-tertiary"
          >
            {{ t("teacher.assistantsDashboard.teamLabel") }}
          </span>
        </div>
        <div class="flex flex-col gap-1">
          <span
            class="text-2xl font-semibold text-content-strong tabular-nums"
          >
            {{ formatNumber(assistantRoleCount) }}
          </span>
          <span
            class="text-[0.75rem] uppercase tracking-[0.08em] text-content-tertiary"
          >
            {{ t("teacher.assistantsDashboard.rolesLabel") }}
          </span>
        </div>
      </div>
      <p v-else class="m-0 text-[0.9rem] text-content-tertiary">
        {{ t("teacher.assistantsDashboard.empty") }}
      </p>

      <div class="flex flex-wrap gap-3">
        <UiButton
          size="sm"
          color="primary"
          prepend-icon="UserSwitchOutlined"
          @click="goToAssistantTeam"
        >
          {{ t("teacher.assistantsDashboard.manageTeam") }}
        </UiButton>
        <UiButton
          size="sm"
          variant="ghost"
          color="neutral"
          prepend-icon="IdcardOutlined"
          @click="goToAssistantRoles"
        >
          {{ t("teacher.assistantsDashboard.manageRoles") }}
        </UiButton>
        <UiButton
          size="sm"
          variant="link"
          color="primary"
          :disabled="assistantsRefreshing"
          @click="refreshAssistantsSummary"
        >
          {{
            assistantsRefreshing
              ? t("teacher.assistantsDashboard.refreshing")
              : t("teacher.assistantsDashboard.refresh")
          }}
        </UiButton>
      </div>
    </template>
  </UiCard>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useTeacherAssistantsStore } from "@/stores/teacherAssistants";
import { useFeaturesStore } from "@/stores/features";
import { FEATURE } from "@/constants/featureCatalog";
import { useTeacherTranslations } from "@/composables/useTeacherTranslations";
import { useTeacherDashboardActions } from "@/composables/useTeacherDashboardActions";
import { useTeacherDashboardRefresh } from "@/composables/useTeacherDashboardRefresh";
import { formatNumber } from "@/utils/formatNumber";
import UiCard from "@/components/ui/UiCard.vue";
import UiAlert from "@/components/ui/UiAlert.vue";
import UiSkeleton from "@/components/ui/UiSkeleton.vue";
import UiButton from "@/components/ui/UiButton.vue";

const { t } = useTeacherTranslations();
const { goToAssistantTeam, goToAssistantRoles } = useTeacherDashboardActions();
const { assistantsRefreshing, refreshAssistantsSummary } =
  useTeacherDashboardRefresh();

const featuresStore = useFeaturesStore();
const teacherAssistantsEnabled = computed(() =>
  featuresStore.hasFeature(FEATURE.teacherAssistants),
);

const assistantsStore = useTeacherAssistantsStore();
const {
  roles: assistantRoles,
  rolesLoading: assistantRolesLoading,
  rolesError: assistantRolesError,
  assistants: assistantAccounts,
  assistantsLoading: assistantAccountsLoading,
  assistantsError: assistantAccountsError,
} = storeToRefs(assistantsStore);

const assistantCount = computed(() => assistantAccounts.value.length);
const assistantRoleCount = computed(() => assistantRoles.value.length);
const assistantsSummaryLoading = computed(
  () => assistantAccountsLoading.value || assistantRolesLoading.value,
);
const assistantsSummaryError = computed(() =>
  Boolean(assistantAccountsError.value || assistantRolesError.value),
);
</script>
