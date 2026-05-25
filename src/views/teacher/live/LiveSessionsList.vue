<template>
  <ThemePage
    :title="t('live.teacher.titlePage')"
    :subtitle="t('live.teacher.subtitle')"
  >
    <template #actions>
      <div class="flex flex-wrap gap-3">
        <UiButton
          variant="outline"
          color="secondary"
          prepend-icon="ReloadOutlined"
          @click="loadSessions"
        >
          {{ t("common.refresh") }}
        </UiButton>
        <UiButton
          color="primary"
          prepend-icon="VideoCameraAddOutlined"
          @click="goToCreate"
        >
          {{ t("live.teacher.newSession") }}
        </UiButton>
      </div>
    </template>

    <section class="mt-4">
      <UiCard hover>
        <!-- Filter bar: search + course + status (stacks on mobile, row on ≥720px) -->
        <div class="flex flex-col gap-3 min-[720px]:flex-row min-[720px]:items-end">
          <div class="min-[720px]:flex-1">
            <UiInput
              v-model="filters.search"
              appearance="search"
              :placeholder="t('live.teacher.searchPlaceholder')"
              :aria-label="t('live.teacher.searchPlaceholder')"
              clearable
            />
          </div>
          <UiSelect
            v-model="filters.courseId"
            :label="t('live.teacher.filterCourse')"
            clearable
            class="min-[720px]:w-56"
          >
            <option value="">{{ t("live.teacher.allCourses") }}</option>
            <option
              v-for="course in courses"
              :key="course.id"
              :value="String(course.id)"
            >
              {{ course.title }}
            </option>
          </UiSelect>
          <UiSelect
            v-model="filters.status"
            :label="t('live.teacher.filterStatus')"
            clearable
            class="min-[720px]:w-56"
          >
            <option value="">{{ t("live.teacher.allStatuses") }}</option>
            <option v-for="s in statusFilterValues" :key="s" :value="s">
              {{ statusLabel(s) }}
            </option>
          </UiSelect>
        </div>

        <!-- Desktop table (≥1025px). Hidden when empty so the single localized
             empty-state alert below covers both viewports (no double empty). -->
        <div
          v-if="loading || filteredSessions.length > 0"
          class="hidden min-[1025px]:block"
        >
          <UiTable :items="pagedSessions" :headers="headers" :loading="loading">
            <template #item.sessionInfo="{ item }">
              <div class="flex items-center gap-3">
                <span
                  class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-sakai-primary/10 text-sakai-primary"
                >
                  <UiIcon name="VideoCameraOutlined" :size="18" />
                </span>
                <div class="flex flex-col">
                  <span class="flex items-center gap-1.5">
                    <span class="font-semibold text-content-strong">{{ item.title }}</span>
                    <span
                      v-if="item.repeatedCopy"
                      class="inline-flex text-content-tertiary"
                      role="img"
                      :title="t('live.teacher.duplicateCopyTooltip')"
                      :aria-label="t('live.teacher.duplicateCopyTooltip')"
                    >
                      <UiIcon name="CopyOutlined" :size="14" />
                    </span>
                    <span
                      v-if="item.repeatSource"
                      class="inline-flex text-content-tertiary"
                      role="img"
                      :title="t('live.teacher.repeatSourceTooltip')"
                      :aria-label="t('live.teacher.repeatSourceTooltip')"
                    >
                      <UiIcon name="ShareAltOutlined" :size="14" />
                    </span>
                  </span>
                  <span v-if="item.courseTitle" class="text-sm text-content-tertiary">
                    {{ item.courseTitle }}
                  </span>
                </div>
              </div>
            </template>
            <template #item.assignedInstructorName="{ item }">
              <div class="flex items-center gap-2">
                <span
                  class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sakai-primary/10 text-xs font-semibold text-sakai-primary"
                >
                  <template v-if="initials(item.assignedInstructorName)">
                    {{ initials(item.assignedInstructorName) }}
                  </template>
                  <UiIcon v-else name="UserOutlined" :size="16" />
                </span>
                <span>{{ item.assignedInstructorName }}</span>
              </div>
            </template>
            <template #item.scheduledAt="{ item }">
              <div v-if="item.scheduledAt" class="flex flex-col gap-1">
                <span class="flex items-center gap-1.5">
                  <UiIcon name="CalendarOutlined" :size="14" class="text-content-tertiary" />
                  {{ formatDateTime(item.scheduledAt, { dateStyle: "medium" }, dateLocale) }}
                </span>
                <span class="flex items-center gap-1.5 text-sm text-content-tertiary">
                  <UiIcon name="ClockCircleOutlined" :size="14" />
                  {{ formatDateTime(item.scheduledAt, { timeStyle: "short" }, dateLocale) }}
                </span>
              </div>
              <span v-else class="text-content-tertiary">{{ t("live.teacher.unscheduled") }}</span>
            </template>
            <template #item.assignedStudentCount="{ item }">
              <span class="flex items-center gap-1.5">
                <UiIcon name="TeamOutlined" :size="16" class="text-content-tertiary" />
                {{ item.assignedStudentCount }}
              </span>
            </template>
            <template #item.status="{ item }">
              <div class="flex flex-wrap items-center gap-2">
                <UiTag size="sm" variant="soft" dot :color="statusColor(item.status)">
                  {{ statusLabel(item.status) }}
                </UiTag>
              </div>
            </template>
            <template #item.actions="{ item }">
              <div class="flex flex-wrap items-center gap-1">
                <UiButton
                  size="sm"
                  variant="link"
                  color="secondary"
                  prepend-icon="EditOutlined"
                  :aria-label="t('common.edit')"
                  :title="t('common.edit')"
                  @click="goToEdit(item)"
                />
                <UiButton
                  size="sm"
                  variant="link"
                  color="danger"
                  prepend-icon="DeleteOutlined"
                  :aria-label="t('common.delete')"
                  :title="t('common.delete')"
                  @click="confirmDelete(item)"
                />
                <UiDropdownMenu :trigger-aria-label="t('common.more')">
                  <template #default="{ close }">
                    <button
                      type="button"
                      role="menuitem"
                      @click="
                        openRegistrations(item);
                        close();
                      "
                    >
                      <UiIcon name="TeamOutlined" :size="16" />
                      <span>{{ t("live.teacher.viewRegistrations") }}</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      @click="
                        summarize(item);
                        close();
                      "
                    >
                      <UiIcon name="AlignLeftOutlined" :size="16" />
                      <span>{{ t("live.teacher.summarizeAttendance") }}</span>
                    </button>
                    <button
                      v-if="liveSessionsChatEnabled"
                      type="button"
                      role="menuitem"
                      @click="
                        openModeration(item);
                        close();
                      "
                    >
                      <UiIcon name="MessageOutlined" :size="16" />
                      <span>{{ t("live.teacher.openModeration") }}</span>
                    </button>
                  </template>
                </UiDropdownMenu>
              </div>
            </template>
          </UiTable>
        </div>

        <!-- Mobile list (<1025px) -->
        <div class="grid gap-3 min-[1025px]:hidden" role="list">
          <article
            v-for="item in pagedSessions"
            :key="item.id"
            class="grid gap-3 rounded-sakai-lg p-4 bg-surface-card [border:1px_solid_color-mix(in_srgb,var(--sakai-border-color)_70%,transparent)]"
            role="listitem"
          >
            <header class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-3">
                <span
                  class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-sakai-primary/10 text-sakai-primary"
                >
                  <UiIcon name="VideoCameraOutlined" :size="18" />
                </span>
                <h3 class="m-0 flex items-center gap-1.5 text-base font-semibold text-content-strong">
                  {{ item.title }}
                  <span
                    v-if="item.repeatedCopy"
                    class="inline-flex text-content-tertiary"
                    role="img"
                    :title="t('live.teacher.duplicateCopyTooltip')"
                    :aria-label="t('live.teacher.duplicateCopyTooltip')"
                  >
                    <UiIcon name="CopyOutlined" :size="14" />
                  </span>
                  <span
                    v-if="item.repeatSource"
                    class="inline-flex text-content-tertiary"
                    role="img"
                    :title="t('live.teacher.repeatSourceTooltip')"
                    :aria-label="t('live.teacher.repeatSourceTooltip')"
                  >
                    <UiIcon name="ShareAltOutlined" :size="14" />
                  </span>
                </h3>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <UiTag size="sm" variant="soft" dot :color="statusColor(item.status)">
                  {{ statusLabel(item.status) }}
                </UiTag>
              </div>
            </header>
            <div class="grid gap-2">
              <span class="text-xs uppercase tracking-wider text-content-tertiary">{{ t("live.teacher.course") }}</span>
              <span>{{ item.courseTitle }}</span>
            </div>
            <div class="grid gap-2">
              <span class="text-xs uppercase tracking-wider text-content-tertiary">{{ t("live.teacher.scheduledAt") }}</span>
              <span>{{
                item.scheduledAt
                  ? formatDateTime(item.scheduledAt, undefined, dateLocale)
                  : t("live.teacher.unscheduled")
              }}</span>
            </div>
            <div class="grid gap-2">
              <span class="text-xs uppercase tracking-wider text-content-tertiary">{{ t("live.teacher.assignedStudents") }}</span>
              <span>{{ item.assignedStudentCount }}</span>
            </div>
            <div class="flex flex-wrap items-center gap-1">
              <UiButton
                size="sm"
                variant="link"
                color="secondary"
                prepend-icon="EditOutlined"
                :aria-label="t('common.edit')"
                :title="t('common.edit')"
                @click="goToEdit(item)"
              />
              <UiButton
                size="sm"
                variant="link"
                color="danger"
                prepend-icon="DeleteOutlined"
                :aria-label="t('common.delete')"
                :title="t('common.delete')"
                @click="confirmDelete(item)"
              />
              <UiDropdownMenu :trigger-aria-label="t('common.more')">
                <template #default="{ close }">
                  <button
                    type="button"
                    role="menuitem"
                    @click="
                      openRegistrations(item);
                      close();
                    "
                  >
                    <UiIcon name="TeamOutlined" :size="16" />
                    <span>{{ t("live.teacher.viewRegistrations") }}</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    @click="
                      summarize(item);
                      close();
                    "
                  >
                    <UiIcon name="AlignLeftOutlined" :size="16" />
                    <span>{{ t("live.teacher.summarizeAttendance") }}</span>
                  </button>
                  <button
                    v-if="liveSessionsChatEnabled"
                    type="button"
                    role="menuitem"
                    @click="
                      openModeration(item);
                      close();
                    "
                  >
                    <UiIcon name="MessageOutlined" :size="16" />
                    <span>{{ t("live.teacher.openModeration") }}</span>
                  </button>
                </template>
              </UiDropdownMenu>
            </div>
          </article>
        </div>

        <UiPagination
          v-if="!loading && filteredSessions.length"
          :current-page="currentPage"
          :total-items="filteredSessions.length"
          :page-size="pageSize"
          :prev-label="t('common.previous')"
          :next-label="t('common.next')"
          @update:current-page="currentPage = $event"
        >
          <template #info="{ from, to, total }">
            {{
              t("pagination.showing", {
                from,
                to,
                total,
                entity: t("live.teacher.sessionsEntity"),
              })
            }}
          </template>
        </UiPagination>

        <UiAlert v-if="error" color="danger" variant="soft">{{
          error
        }}</UiAlert>
        <UiAlert
          v-else-if="!loading && !filteredSessions.length"
          color="neutral"
          variant="soft"
        >
          {{ t("live.teacher.emptyState") }}
        </UiAlert>
      </UiCard>
    </section>

    <LiveRegistrations
      :open="showRegistrations"
      :session-id="activeSession?.id ?? null"
      :session-title="activeSession?.title"
      @close="closeRegistrations"
    />
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import ThemePage from "@/layout/theme/ThemePage.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiCard from "@/components/ui/UiCard.vue";
import UiTable, { type UiTableHeader } from "@/components/ui/UiTable.vue";
import UiSelect from "@/components/ui/UiSelect.vue";
import UiInput from "@/components/ui/UiInput.vue";
import UiAlert from "@/components/ui/UiAlert.vue";
import UiTag from "@/components/ui/UiTag.vue";
import UiIcon from "@/components/ui/UiIcon.vue";
import UiPagination from "@/components/ui/UiPagination.vue";
import UiDropdownMenu from "@/components/ui/UiDropdownMenu.vue";
import { useCoursesStore } from "@/stores/courses";
import { useFeaturesStore } from "@/stores/features";
import { FEATURE } from "@/constants/featureCatalog";
import { useRouter } from "vue-router";

import { useToast } from "@/composables/useToast";
import {
  listTeacherSessions,
  deleteTeacherSession,
  summarizeAttendance,
  type TeacherLiveSession,
  type TeacherLiveSessionsPage,
  type LiveSessionStatus,
} from "@/api/live";
import LiveRegistrations from "./LiveRegistrations.vue";
import { formatDateTime } from "@/utils/formatters";

const { t, locale } = useI18n();
const toast = useToast();
const coursesStore = useCoursesStore();
const featuresStore = useFeaturesStore();
const router = useRouter();

const sessions = ref<TeacherLiveSession[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const activeSession = ref<TeacherLiveSession | null>(null);
const showRegistrations = ref(false);

const filters = reactive({ courseId: "", search: "", status: "" });

// Status values offered in the filter (cancelled is shown under "all" only).
const statusFilterValues: LiveSessionStatus[] = ["live", "scheduled", "ended"];

const currentPage = ref(1);
const pageSize = ref(10);

const headers = computed<UiTableHeader[]>(() => [
  { key: "sessionInfo", title: t("live.teacher.sessionTitle") },
  {
    key: "assignedInstructorName",
    title: t("live.teacher.assignedInstructor"),
  },
  { key: "scheduledAt", title: t("live.teacher.scheduledAt") },
  { key: "assignedStudentCount", title: t("live.teacher.assignedStudents") },
  { key: "status", title: t("live.teacher.status") },
  { key: "actions", title: t("common.actions"), sortable: false },
]);

const courses = computed(() => coursesStore.list);
const liveSessionsChatEnabled = computed(() =>
  featuresStore.hasFeature(FEATURE.liveSessionsChat),
);

// Render dates in the active UI locale; force Latin digits for Arabic
// (project-wide digits policy) via the `-u-nu-latn` Unicode extension.
const dateLocale = computed(() =>
  locale.value === "ar" ? "ar-u-nu-latn" : String(locale.value),
);

// Client-side search + status filter over the loaded (course-filtered) sessions.
const filteredSessions = computed(() => {
  const q = filters.search.trim().toLowerCase();
  return sessions.value.filter((session) => {
    const matchesSearch = !q || (session.title?.toLowerCase().includes(q) ?? false);
    const matchesStatus = !filters.status || session.status === filters.status;
    return matchesSearch && matchesStatus;
  });
});

const pagedSessions = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredSessions.value.slice(start, start + pageSize.value);
});

watch([() => filters.search, () => filters.status], () => {
  currentPage.value = 1;
});

watch(
  () => filters.courseId,
  () => {
    loadSessions();
  },
);

onMounted(async () => {
  if (!coursesStore.list.length) {
    await coursesStore.fetchCourses().catch(() => {
      /* ignore */
    });
  }
  loadSessions();
});

async function loadSessions() {
  loading.value = true;
  error.value = null;
  try {
    const query: Parameters<typeof listTeacherSessions>[0] = {
      page: 0,
      size: 100,
    };
    if (filters.courseId) {
      query.courseId = Number(filters.courseId);
    }
    const data: TeacherLiveSessionsPage = await listTeacherSessions(query);
    sessions.value = data.items;
    currentPage.value = 1;
  } catch (err: unknown) {
    error.value = t("live.teacher.loadError");
  } finally {
    loading.value = false;
  }
}

function goToCreate() {
  router.push({ name: "teacher-session-create" });
}

function goToEdit(session: TeacherLiveSession) {
  router.push({
    name: "teacher-session-edit",
    params: { sessionId: session.id },
  });
}

function openRegistrations(session: TeacherLiveSession) {
  activeSession.value = session;
  showRegistrations.value = true;
}

function closeRegistrations() {
  showRegistrations.value = false;
}

async function confirmDelete(session: TeacherLiveSession) {
  if (
    !window.confirm(t("live.teacher.deleteConfirm", { title: session.title }))
  ) {
    return;
  }
  try {
    await deleteTeacherSession(session.id);
    toast.success(t("live.teacher.deleteSuccess"));
    await loadSessions();
  } catch (err: unknown) {
    toast.error(t("live.teacher.deleteError"));
  }
}

async function summarize(session: TeacherLiveSession) {
  try {
    await summarizeAttendance(session.id);
    toast.success(t("live.teacher.summarizeSuccess"));
  } catch (err: unknown) {
    toast.error(t("live.teacher.summarizeError"));
  }
}

function openModeration(session: TeacherLiveSession) {
  router.push({
    name: "teacher-live-moderation",
    query: { sessionId: String(session.id) },
  });
}

function initials(name?: string) {
  if (!name) return "";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

function statusColor(status: LiveSessionStatus) {
  switch (status) {
    case "live":
      return "danger";
    case "scheduled":
      return "info";
    case "ended":
      return "neutral";
    case "cancelled":
      return "neutral";
    default:
      return "info";
  }
}

function statusLabel(status: LiveSessionStatus) {
  return t(`live.teacher.statusLabel.${status}`);
}
</script>
