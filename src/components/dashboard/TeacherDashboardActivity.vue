<template>
  <UiCard
    class="teacher-dashboard__activity md:col-span-6 lg:col-span-8 flex flex-col gap-5"
    :title="t('teacher.activityTitle')"
    :subtitle="t('teacher.activitySubtitle')"
    hover
  >
    <div v-if="showActivitySkeleton" class="flex flex-col gap-5">
      <div
        v-for="index in 3"
        :key="`activity-skeleton-${index}`"
        class="flex items-start gap-3"
      >
        <UiSkeleton width="0.5rem" height="0.5rem" class="mt-1.5 shrink-0" />
        <div class="flex-1 flex flex-col gap-1.5">
          <UiSkeleton height="0.9rem" width="65%" />
          <UiSkeleton height="0.75rem" width="35%" />
        </div>
      </div>
    </div>
    <template v-else>
      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <h3
            class="m-0 text-[0.85rem] font-semibold text-content-secondary uppercase tracking-[0.08em]"
          >
            {{ t("teacher.upcomingSessions") }}
          </h3>
          <UiButton
            size="sm"
            variant="link"
            color="info"
            @click="goToLiveSessions"
          >
            {{ t("teacher.activityViewAllSessions") }}
          </UiButton>
        </div>
        <ul
          class="teacher-dashboard__activity-timeline list-none m-0 p-0 flex flex-col"
        >
          <li
            v-for="session in upcomingSessions"
            :key="session.id"
            class="teacher-dashboard__activity-item relative flex items-start gap-3 pb-4 last:pb-0 before:content-[''] before:absolute before:start-[5.5px] before:top-6 before:bottom-0 before:[border-inline-start:1px_dashed_var(--sakai-border-color)] before:pointer-events-none last:before:hidden"
          >
            <span
              :class="[
                'teacher-dashboard__activity-dot',
                'mt-1.5 h-3 w-3 rounded-full shrink-0',
                getSessionDotTone(session),
              ]"
              aria-hidden="true"
            />
            <div class="flex-1 flex flex-col gap-0.5 min-w-0">
              <div class="flex items-baseline gap-2 flex-wrap">
                <span
                  class="text-[0.85rem] text-content-secondary font-medium tabular-nums"
                >
                  {{ formatActivityDateTime(session.scheduledAt) }}
                </span>
                <span class="font-medium text-content">
                  {{ session.title }}
                </span>
              </div>
              <span
                class="inline-flex items-center px-2 py-0.5 rounded bg-content-tertiary/10 text-content-secondary text-[0.7rem] font-medium w-fit"
              >
                {{ session.courseTitle }}
              </span>
            </div>
          </li>
          <li
            v-if="!upcomingSessions.length"
            class="text-[0.85rem] text-content-tertiary py-3"
          >
            {{ t("teacher.noSessions") }}
          </li>
        </ul>
      </div>

      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <h3
            class="m-0 text-[0.85rem] font-semibold text-content-secondary uppercase tracking-[0.08em]"
          >
            {{ t("teacher.upcomingAssignments") }}
          </h3>
          <UiButton
            size="sm"
            variant="link"
            color="primary"
            @click="goToLearning"
          >
            {{ t("teacher.activityReviewAssignments") }}
          </UiButton>
        </div>
        <ul
          class="teacher-dashboard__activity-timeline list-none m-0 p-0 flex flex-col"
        >
          <li
            v-for="assignment in upcomingAssignments"
            :key="assignment.id"
            class="teacher-dashboard__activity-item relative flex items-start gap-3 pb-4 last:pb-0 before:content-[''] before:absolute before:start-[5.5px] before:top-6 before:bottom-0 before:[border-inline-start:1px_dashed_var(--sakai-border-color)] before:pointer-events-none last:before:hidden"
          >
            <span
              :class="[
                'teacher-dashboard__activity-dot',
                'mt-1.5 h-3 w-3 rounded-full shrink-0',
                getAssignmentDotTone(assignment),
              ]"
              aria-hidden="true"
            />
            <div class="flex-1 flex flex-col gap-0.5 min-w-0">
              <div class="flex items-baseline gap-2 flex-wrap">
                <span
                  class="text-[0.85rem] text-content-secondary font-medium tabular-nums"
                >
                  {{ formatActivityDateTime(assignment.dueAt) }}
                </span>
                <span class="font-medium text-content">
                  {{ assignment.title }}
                </span>
              </div>
              <span
                class="inline-flex items-center px-2 py-0.5 rounded bg-content-tertiary/10 text-content-secondary text-[0.7rem] font-medium w-fit"
              >
                {{ assignment.courseTitle }}
              </span>
            </div>
          </li>
          <li
            v-if="!upcomingAssignments.length"
            class="text-[0.85rem] text-content-tertiary py-3"
          >
            {{ t("teacher.noAssignments") }}
          </li>
        </ul>
      </div>
    </template>
  </UiCard>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useTeacherActivityStore } from "@/stores/teacherActivity";
import type { LiveSessionSummary } from "@/services/liveSessions";
import type { Assignment } from "@/services/learning";
import { useTeacherTranslations } from "@/composables/useTeacherTranslations";
import { useTeacherDashboardActions } from "@/composables/useTeacherDashboardActions";
import UiCard from "@/components/ui/UiCard.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiSkeleton from "@/components/ui/UiSkeleton.vue";

const { t, locale } = useTeacherTranslations();
const { goToLiveSessions, goToLearning } = useTeacherDashboardActions();

const activityStore = useTeacherActivityStore();
const {
  upcomingSessions,
  upcomingAssignments,
  loading: activityLoading,
} = storeToRefs(activityStore);

const showActivitySkeleton = computed(
  () =>
    activityLoading.value &&
    !upcomingSessions.value.length &&
    !upcomingAssignments.value.length,
);

const ACTIVITY_DOT_MUTED = "border-2 border-content-tertiary/40 bg-transparent";

const getSessionDotTone = (session: LiveSessionSummary) => {
  if (session.status === "live") return "bg-sakai-danger";
  if (session.status === "scheduled") return "bg-sakai-primary";
  return ACTIVITY_DOT_MUTED;
};

const getAssignmentDotTone = (assignment: Assignment) => {
  if (!assignment.dueAt) return ACTIVITY_DOT_MUTED;
  const dueMs = new Date(assignment.dueAt).getTime();
  if (Number.isNaN(dueMs)) return ACTIVITY_DOT_MUTED;
  const diff = dueMs - Date.now();
  if (diff < 0) return "bg-sakai-danger";
  if (diff < 24 * 60 * 60 * 1000) return "bg-sakai-warning";
  return ACTIVITY_DOT_MUTED;
};

const localeTag = computed(() => (locale.value === "ar" ? "ar-EG" : "en-US"));

const formatActivityDateTime = (value?: string | null) => {
  if (!value) return t("teacher.dateTimeTbd");
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return t("teacher.dateTimeTbd");
  const now = new Date();
  const isSameDay =
    parsed.getFullYear() === now.getFullYear() &&
    parsed.getMonth() === now.getMonth() &&
    parsed.getDate() === now.getDate();
  const isSameYear = parsed.getFullYear() === now.getFullYear();
  try {
    if (isSameDay) {
      return new Intl.DateTimeFormat(localeTag.value, {
        hour: "numeric",
        minute: "2-digit",
      }).format(parsed);
    }
    if (isSameYear) {
      return new Intl.DateTimeFormat(localeTag.value, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(parsed);
    }
    return new Intl.DateTimeFormat(localeTag.value, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(parsed);
  } catch (error) {
    return parsed.toLocaleString();
  }
};
</script>
