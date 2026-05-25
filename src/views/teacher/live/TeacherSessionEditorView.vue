<template>
  <ThemePage
    :title="t('liveSession.editor.title')"
    :subtitle="t('liveSession.editor.subtitle')"
    class="min-[1025px]:[&_.theme-page__sidebar]:basis-[21.875rem]"
  >
    <template #actions>
      <div class="flex flex-wrap gap-3">
        <UiButton
          variant="outline"
          color="neutral"
          prepend-icon="CloseOutlined"
          @click="handleCancel"
        >
          {{ t("common.cancel") }}
        </UiButton>
        <UiButton
          color="primary"
          prepend-icon="CalendarOutlined"
          :disabled="!canSave || submitting"
          :loading="submitting"
          @click="submit"
        >
          {{ saveLabel }}
        </UiButton>
      </div>
    </template>

    <div class="flex flex-col gap-5">
      <!-- Basic information -->
      <UiCollapsibleSection
        :title="t('liveSession.editor.basicInfoSection')"
        icon="FileTextOutlined"
        default-open
      >
        <div class="flex flex-col gap-4">
          <UiInput
            v-model="form.title"
            :label="t('live.teacher.title')"
            required
          />
          <UiTextarea
            v-model="form.description"
            :label="t('live.teacher.description')"
            :rows="3"
            required
          />
          <UiSelect
            v-if="mode === 'create'"
            v-model="form.courseId"
            :label="t('live.teacher.course')"
            required
          >
            <option value="" disabled>{{ t("live.teacher.selectCourse") }}</option>
            <option v-for="course in courses" :key="course.id" :value="course.id">
              {{ course.title }}
            </option>
          </UiSelect>
          <UiSelect
            v-if="mode === 'create'"
            v-model.number="form.moduleId"
            :label="t('live.teacher.moduleId')"
            :disabled="!form.courseId || modulesLoading || moduleOptions.length === 0"
          >
            <option value="">
              {{ modulesLoading ? t("common.loading") : t("common.select") }}
            </option>
            <option
              v-for="module in moduleOptions"
              :key="module.value"
              :value="module.value"
            >
              {{ module.label }}
            </option>
          </UiSelect>
        </div>
      </UiCollapsibleSection>

      <!-- Scheduling & recurrence -->
      <UiCollapsibleSection
        :title="t('liveSession.editor.schedulingSection')"
        icon="ClockCircleOutlined"
        default-open
      >
        <div class="flex flex-col gap-4">
          <UiDateTimePicker
            v-model="form.scheduledAt"
            :label="t('live.teacher.scheduledAt')"
            clearable
            required
          />
          <UiInput
            v-model.number="form.durationMinutes"
            type="number"
            min="5"
            :label="t('live.teacher.durationMinutes')"
            required
          />
          <UiSwitch
            v-model="form.isRecurring"
            :label="t('tutoring.teacher.isRecurring')"
          />
          <UiSwitch
            v-if="mode === 'create'"
            v-model="form.repeatEnabled"
            :label="t('live.teacher.repeatEnabled')"
          />
          <div v-if="mode === 'create' && form.repeatEnabled" class="flex gap-4">
            <UiInput
              v-model.number="form.repeatCount"
              type="number"
              min="1"
              class="flex-1"
              :label="t('live.teacher.repeatCount')"
              required
            />
            <UiSelect
              v-model="form.repeatInterval"
              class="flex-1"
              :label="t('live.teacher.repeatInterval')"
              required
            >
              <option value="DAILY">{{ t("live.teacher.repeatDaily") }}</option>
              <option value="WEEKLY">{{ t("live.teacher.repeatWeekly") }}</option>
              <option value="MONTHLY">{{ t("live.teacher.repeatMonthly") }}</option>
            </UiSelect>
          </div>
        </div>
      </UiCollapsibleSection>
    </div>

    <template #sidebar>
      <div class="flex flex-col gap-5">
        <!-- Broadcast settings -->
        <UiCard>
          <div class="flex items-center gap-2.5">
            <span
              class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-sakai-md bg-[var(--sakai-primary-tint-12)] text-sakai-primary"
            >
              <UiIcon name="VideoCameraOutlined" :size="16" />
            </span>
            <h3 class="m-0 text-[0.9375rem] font-bold text-content-strong">
              {{ t("liveSession.editor.broadcastSection") }}
            </h3>
          </div>
          <div class="flex flex-col gap-4">
            <UiSelect
              v-model="form.provider"
              :label="t('live.teacher.provider')"
              required
              @change="onProviderChange"
            >
              <option value="zoom">Zoom</option>
              <option value="google_meet">Google Meet</option>
            </UiSelect>
            <UiInput v-model="form.joinUrl" :label="t('live.teacher.joinUrl')" />
            <template v-if="form.provider === 'zoom'">
              <UiInput
                v-model="form.providerConfig.meetingId"
                :label="t('live.teacher.zoomMeetingId')"
              />
              <UiInput
                v-model="form.providerConfig.passcode"
                :label="t('live.teacher.zoomPasscode')"
              />
            </template>
            <template v-else-if="form.provider === 'google_meet'">
              <UiInput
                v-model="form.providerConfig.meetingCode"
                :label="t('live.teacher.meetCode')"
              />
              <UiInput
                v-model="form.providerConfig.calendarEventId"
                :label="t('live.teacher.meetEventId')"
              />
            </template>
          </div>
        </UiCard>

        <!-- Instructor & permissions -->
        <UiCard>
          <div class="flex items-center gap-2.5">
            <span
              class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-sakai-md bg-[var(--sakai-primary-tint-12)] text-sakai-primary"
            >
              <UiIcon name="UserOutlined" :size="16" />
            </span>
            <h3 class="m-0 text-[0.9375rem] font-bold text-content-strong">
              {{ t("liveSession.editor.instructorSection") }}
            </h3>
          </div>
          <div class="flex flex-col gap-4">
            <UiSelect
              v-model="form.assignedInstructorId"
              :label="t('tutoring.teacher.assistantLabel')"
              required
            >
              <option value="">{{ t("common.select") || "Select" }}</option>
              <option
                v-for="option in filteredAssistantOptions"
                :key="option.id"
                :value="option.id"
              >
                {{ option.name }}
              </option>
            </UiSelect>
            <UiMultiSelect
              v-model="form.studentIds"
              :label="t('tutoring.teacher.sessionStudent')"
              :options="studentSelectOptions"
              :placeholder="t('live.teacher.studentsPlaceholder')"
              :loading-text="t('common.loading')"
              :empty-text="t('common.noOptions')"
              :remove-label="t('common.remove')"
            />
          </div>
        </UiCard>
      </div>
    </template>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import ThemePage from "@/layout/theme/ThemePage.vue";
import UiCollapsibleSection from "@/components/ui/UiCollapsibleSection.vue";
import UiCard from "@/components/ui/UiCard.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiInput from "@/components/ui/UiInput.vue";
import UiTextarea from "@/components/ui/UiTextarea.vue";
import UiSelect from "@/components/ui/UiSelect.vue";
import UiMultiSelect from "@/components/ui/UiMultiSelect.vue";
import UiDateTimePicker from "@/components/ui/UiDateTimePicker.vue";
import UiSwitch from "@/components/ui/UiSwitch.vue";
import UiIcon from "@/components/ui/UiIcon.vue";
import { useCoursesStore } from "@/stores/courses";
import { useTeacherAssistantsStore } from "@/stores/teacherAssistants";
import { useTeacherRosterStore } from "@/stores/teacherRoster";
import { useToast } from "@/composables/useToast";
import {
  getTeacherSession,
  createTeacherSession,
  updateTeacherSession,
  listTeacherRegistrations,
  type TeacherLiveSession,
  type TeacherLiveSessionCreatePayload,
  type TeacherLiveSessionUpdatePayload,
} from "@/api/live";

interface FormState {
  courseId: number | "";
  title: string;
  description: string;
  scheduledAt: string;
  durationMinutes: number;
  provider: string;
  joinUrl: string;
  providerConfig: Record<string, string>;
  assignedInstructorId: number | "";
  studentIds: number[];
  moduleId: number | "";
  isRecurring: boolean;
  repeatEnabled: boolean;
  repeatCount: number;
  repeatInterval: string;
}

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const coursesStore = useCoursesStore();
const assistantsStore = useTeacherAssistantsStore();
const rosterStore = useTeacherRosterStore();

const sessionId = computed(() => Number(route.params.sessionId));
const mode = computed<"create" | "edit">(() =>
  route.params.sessionId ? "edit" : "create",
);

const submitting = ref(false);
const isDirty = ref(false);
const syncing = ref(true);

const form = reactive<FormState>({
  courseId: "",
  title: "",
  description: "",
  scheduledAt: "",
  durationMinutes: 60,
  provider: "zoom",
  joinUrl: "",
  providerConfig: {},
  assignedInstructorId: "",
  studentIds: [],
  moduleId: "",
  isRecurring: false,
  repeatEnabled: false,
  repeatCount: 1,
  repeatInterval: "WEEKLY",
});

const courses = computed(() => coursesStore.list);

const filteredAssistantOptions = computed(() =>
  assistantsStore.assistants.map((assistant) => ({
    id: assistant.id,
    name: assistant.name,
  })),
);

const studentOptions = computed(() =>
  rosterStore.students.map((student) => ({
    id: student.studentId,
    name: student.name,
    email: student.email,
  })),
);

const studentSelectOptions = computed(() =>
  studentOptions.value.map((student) => ({
    value: student.id,
    label: student.name,
  })),
);

// Module options are sourced from the selected course's detail (existing
// `fetchCourse` endpoint — no new backend). create-mode only.
const modulesLoading = ref(false);
const moduleOptions = computed(() => {
  const current = coursesStore.current;
  if (!current || current.id !== Number(form.courseId)) return [];
  return (current.modules ?? []).map((module) => ({
    value: module.id,
    label: module.title,
  }));
});

const saveLabel = computed(() =>
  mode.value === "create"
    ? t("liveSession.editor.scheduleSession")
    : t("liveSession.editor.updateSession"),
);

const canSave = computed(() => {
  const base =
    Boolean(form.title.trim()) &&
    Boolean(form.description.trim()) &&
    Boolean(form.scheduledAt) &&
    form.durationMinutes > 0 &&
    form.assignedInstructorId !== "" &&
    form.studentIds.length > 0;
  return mode.value === "create" ? base && form.courseId !== "" : base;
});

// Deep dirty tracking, guarded during programmatic load/seed (Course Editor pattern).
watch(
  form,
  () => {
    if (!syncing.value) {
      isDirty.value = true;
    }
  },
  { deep: true },
);

// When the course changes (create mode), reset the module selection and load
// that course's modules via the existing course-detail endpoint.
watch(
  () => form.courseId,
  async (courseId) => {
    if (mode.value !== "create") return;
    form.moduleId = "";
    if (courseId === "" || courseId == null) return;
    const id = Number(courseId);
    if (coursesStore.current?.id === id) return;
    modulesLoading.value = true;
    try {
      await coursesStore.fetchCourse(id);
    } catch {
      /* leave moduleOptions empty on failure */
    } finally {
      modulesLoading.value = false;
    }
  },
);

function seedFromSession(session: TeacherLiveSession, studentIds: number[]) {
  form.courseId = session.courseId;
  form.title = session.title;
  form.description = session.description ?? "";
  form.scheduledAt = session.scheduledAt ? session.scheduledAt.slice(0, 16) : "";
  form.durationMinutes = session.durationMinutes ?? 60;
  form.provider = session.provider;
  form.joinUrl = session.joinUrl ?? "";
  form.providerConfig = Object.fromEntries(
    Object.entries(session.providerConfig ?? {}).map(([key, value]) => [
      key,
      typeof value === "string" ? value : (value?.toString() ?? ""),
    ]),
  );
  form.assignedInstructorId = session.assignedInstructorId ?? "";
  form.studentIds = studentIds;
  form.moduleId = session.moduleId ?? "";
  form.isRecurring = session.isRecurring ?? false;
  form.repeatEnabled = false;
  form.repeatCount = 1;
  form.repeatInterval = "WEEKLY";
}

onMounted(async () => {
  if (!coursesStore.list.length) {
    await coursesStore.fetchCourses().catch(() => {
      /* ignore */
    });
  }
  assistantsStore.loadAssistants(false).catch(() => {});
  rosterStore.loadStudents().catch(() => {});

  if (mode.value === "edit") {
    try {
      const [session, regs] = await Promise.all([
        getTeacherSession(sessionId.value),
        listTeacherRegistrations(sessionId.value),
      ]);
      seedFromSession(
        session,
        regs.map((r) => r.studentId),
      );
    } catch {
      toast.error(t("live.teacher.loadError"));
    }
  }

  nextTick(() => {
    syncing.value = false;
  });
});

function onProviderChange() {
  form.providerConfig = {};
}

function normalisedProviderConfig() {
  const cleaned = Object.fromEntries(
    Object.entries(form.providerConfig)
      .filter(([, value]) => value && value.toString().trim().length > 0)
      .map(([key, value]) => [key, value.toString().trim()]),
  );
  return Object.keys(cleaned).length ? cleaned : undefined;
}

async function submit() {
  if (form.studentIds.length === 0) {
    toast.error(t("live.teacher.studentRequired"));
    return;
  }
  if (!form.assignedInstructorId) {
    toast.error(t("live.teacher.instructorRequired"));
    return;
  }

  submitting.value = true;
  try {
    if (mode.value === "create") {
      const payload: TeacherLiveSessionCreatePayload = {
        courseId: Number(form.courseId),
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        provider: form.provider,
        providerConfig: normalisedProviderConfig(),
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        durationMinutes: form.durationMinutes,
        joinUrl: form.joinUrl || undefined,
        assignedInstructorId: Number(form.assignedInstructorId),
        studentIds: form.studentIds,
        moduleId: form.moduleId === "" ? undefined : Number(form.moduleId),
        isRecurring: form.isRecurring,
        repeatEnabled: form.repeatEnabled,
        repeatCount: form.repeatEnabled ? form.repeatCount : undefined,
        repeatInterval: form.repeatEnabled
          ? (form.repeatInterval as "WEEKLY" | "DAILY" | "MONTHLY")
          : undefined,
      } as TeacherLiveSessionCreatePayload;
      await createTeacherSession(payload);
      toast.success(t("live.teacher.createSuccess"));
    } else {
      const payload: TeacherLiveSessionUpdatePayload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        provider: form.provider,
        providerConfig: normalisedProviderConfig(),
        scheduledAt: form.scheduledAt
          ? new Date(form.scheduledAt).toISOString()
          : undefined,
        durationMinutes: form.durationMinutes,
        joinUrl: form.joinUrl || undefined,
        assignedInstructorId: Number(form.assignedInstructorId),
        studentIds: form.studentIds,
        isRecurring: form.isRecurring,
      };
      await updateTeacherSession(sessionId.value, payload);
      toast.success(t("live.teacher.updateSuccess"));
    }
    isDirty.value = false;
    router.push({ name: "teacher-live-sessions" });
  } catch {
    toast.error(
      mode.value === "create"
        ? t("live.teacher.createError")
        : t("live.teacher.updateError"),
    );
  } finally {
    submitting.value = false;
  }
}

function handleCancel() {
  if (isDirty.value && !window.confirm(t("courses.cancelConfirmUnsaved"))) {
    return;
  }
  router.push({ name: "teacher-live-sessions" });
}
</script>
