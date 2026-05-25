<template>
  <UiCard
    class="teacher-dashboard__views md:col-span-6 lg:col-span-4 flex flex-col gap-4"
    :title="viewsCardTitle"
    :subtitle="viewsCardSubtitle"
    hover
  >
    <div v-if="showViewsSkeleton" class="flex flex-col gap-5">
      <div
        class="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(140px,1fr))]"
      >
        <div
          v-for="i in 4"
          :key="`views-stat-skel-${i}`"
          class="flex flex-col gap-2"
        >
          <UiSkeleton height="1.5rem" width="60%" />
          <UiSkeleton height="0.75rem" width="40%" />
        </div>
      </div>
      <div class="flex flex-col gap-2">
        <UiSkeleton height="0.85rem" width="30%" />
        <div
          v-for="i in 3"
          :key="`views-row-skel-${i}`"
          class="flex items-center gap-3 py-2"
        >
          <UiSkeleton width="1.25rem" height="0.9rem" />
          <UiSkeleton height="0.9rem" class="flex-1" />
          <UiSkeleton width="3rem" height="0.9rem" />
        </div>
      </div>
    </div>
    <UiAlert v-else-if="viewsError" color="warning" variant="soft">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <span>{{ viewsErrorMessage }}</span>
        <UiButton
          v-if="showViewsRetry"
          size="sm"
          variant="link"
          color="warning"
          @click="void teacherViewsStore.loadSummary()"
        >
          {{ viewsRetryLabel }}
        </UiButton>
      </div>
    </UiAlert>
    <div v-else class="flex flex-col gap-5">
      <div
        class="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(140px,1fr))]"
      >
        <div class="flex flex-col gap-1">
          <span
            class="text-2xl font-semibold text-content-strong tabular-nums"
          >
            {{ formatNumber(viewsSummarySafe.totalViews) }}
          </span>
          <span
            class="text-[0.75rem] uppercase tracking-[0.08em] text-content-tertiary"
          >
            {{ viewsTotalLabel }}
          </span>
        </div>
        <div class="flex flex-col gap-1">
          <span
            class="text-2xl font-semibold text-content-strong tabular-nums"
          >
            {{ formatNumber(viewsSummarySafe.landingViews) }}
          </span>
          <span
            class="text-[0.75rem] uppercase tracking-[0.08em] text-content-tertiary"
          >
            {{ viewsLandingLabel }}
          </span>
        </div>
        <div class="flex flex-col gap-1">
          <span
            class="text-2xl font-semibold text-content-strong tabular-nums"
          >
            {{ formatNumber(viewsSummarySafe.profileViews) }}
          </span>
          <span
            class="text-[0.75rem] uppercase tracking-[0.08em] text-content-tertiary"
          >
            {{ viewsProfileLabel }}
          </span>
        </div>
        <div class="flex flex-col gap-1">
          <span
            class="text-2xl font-semibold text-content-strong tabular-nums"
          >
            {{ formatNumber(viewsSummarySafe.courseViews) }}
          </span>
          <span
            class="text-[0.75rem] uppercase tracking-[0.08em] text-content-tertiary"
          >
            {{ viewsCourseLabel }}
          </span>
        </div>
      </div>
      <div class="flex flex-col gap-2">
        <span
          class="text-[0.85rem] font-semibold text-content-secondary uppercase tracking-[0.08em]"
        >
          {{ viewsTopCoursesTitle }}
        </span>
        <ul
          v-if="viewsSummarySafe.topCourses.length"
          class="list-none p-0 m-0 flex flex-col divide-y divide-solid divide-[color-mix(in_srgb,var(--sakai-border-color)_40%,transparent)]"
        >
          <li
            v-for="(course, index) in viewsSummarySafe.topCourses"
            :key="course.courseId"
            class="flex items-center gap-3 py-2.5"
          >
            <span
              class="w-5 text-[0.8rem] text-content-tertiary font-medium tabular-nums shrink-0"
            >
              {{ index + 1 }}
            </span>
            <span
              class="flex-1 min-w-0 truncate font-medium text-content"
              :title="course.title"
            >
              {{ course.title }}
            </span>
            <span
              class="text-[0.85rem] text-content-secondary font-medium tabular-nums shrink-0"
            >
              {{ formatNumber(course.views) }}
            </span>
          </li>
        </ul>
        <p v-else class="text-[0.85rem] text-content-tertiary py-3 m-0">
          {{ viewsEmptyLabel }}
        </p>
      </div>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useTeacherViewsStore } from "@/stores/teacherViews";
import { useTeacherTranslations } from "@/composables/useTeacherTranslations";
import { formatNumber } from "@/utils/formatNumber";
import UiCard from "@/components/ui/UiCard.vue";
import UiAlert from "@/components/ui/UiAlert.vue";
import UiSkeleton from "@/components/ui/UiSkeleton.vue";
import UiButton from "@/components/ui/UiButton.vue";

const { translateTeacher } = useTeacherTranslations();

const teacherViewsStore = useTeacherViewsStore();
const {
  summary: viewsSummary,
  loading: viewsLoading,
  error: viewsError,
} = storeToRefs(teacherViewsStore);

const viewsCardTitle = computed(() =>
  translateTeacher("teacher.viewsCardTitle", "Profile & course views"),
);
const viewsCardSubtitle = computed(() =>
  translateTeacher(
    "teacher.viewsCardSubtitle",
    "Realtime view activity from the last 30 days.",
  ),
);
const viewsTotalLabel = computed(() =>
  translateTeacher("teacher.viewsTotalLabel", "Total views"),
);
const viewsLandingLabel = computed(() =>
  translateTeacher("teacher.viewsLandingLabel", "Landing"),
);
const viewsProfileLabel = computed(() =>
  translateTeacher("teacher.viewsProfileLabel", "Profile"),
);
const viewsCourseLabel = computed(() =>
  translateTeacher("teacher.viewsCourseLabel", "Course pages"),
);
const viewsTopCoursesTitle = computed(() =>
  translateTeacher("teacher.viewsTopCoursesTitle", "Top courses"),
);
const viewsEmptyLabel = computed(() =>
  translateTeacher("teacher.viewsEmpty", "No views yet."),
);
const viewsUnauthorizedLabel = computed(() =>
  translateTeacher(
    "teacher.viewsUnauthorized",
    "Sign in again to see your view analytics.",
  ),
);
const viewsLoadErrorLabel = computed(() =>
  translateTeacher(
    "teacher.viewsLoadError",
    "We couldn't load view analytics. Try again.",
  ),
);
const viewsRetryLabel = computed(() =>
  translateTeacher("teacher.viewsRetry", "Retry"),
);

const viewsSummarySafe = computed(() => ({
  landingViews: viewsSummary.value?.landingViews ?? 0,
  profileViews: viewsSummary.value?.profileViews ?? 0,
  courseViews: viewsSummary.value?.courseViews ?? 0,
  totalViews: viewsSummary.value?.totalViews ?? 0,
  topCourses: viewsSummary.value?.topCourses ?? [],
}));

const showViewsSkeleton = computed(
  () => viewsLoading.value && !viewsSummary.value,
);
const viewsErrorMessage = computed(() =>
  viewsError.value === "UNAUTHORIZED"
    ? viewsUnauthorizedLabel.value
    : viewsLoadErrorLabel.value,
);
const showViewsRetry = computed(() => viewsError.value !== "UNAUTHORIZED");
</script>
