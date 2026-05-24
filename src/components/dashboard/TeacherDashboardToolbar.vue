<template>
  <div
    class="teacher-dashboard__toolbar flex items-center justify-end gap-3 flex-wrap"
  >
    <UiButton
      size="sm"
      variant="ghost"
      color="neutral"
      prepend-icon="ReloadOutlined"
      :disabled="isRefreshing"
      @click="void refreshAll()"
    >
      {{ t("teacher.refreshDashboard") }}
    </UiButton>
    <span
      v-if="lastUpdatedLabel"
      class="teacher-dashboard__toolbar-meta text-[0.85rem] text-content-tertiary"
    >
      {{ lastUpdatedLabel }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { useTeacherDashboardRefresh } from "@/composables/useTeacherDashboardRefresh";
import { useTeacherTranslations } from "@/composables/useTeacherTranslations";
import UiButton from "@/components/ui/UiButton.vue";

const { t } = useTeacherTranslations();
const { isRefreshing, lastUpdatedLabel, refreshAll } =
  useTeacherDashboardRefresh();
</script>
