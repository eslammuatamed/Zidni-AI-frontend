<template>
  <UiDialog
    :model-value="open"
    :title="dialogTitle"
    width="560px"
    @update:model-value="onClose"
  >
    <form class="live-form" @submit.prevent="submit">
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

      <UiInput v-model="form.title" :label="t('live.teacher.title')" required />
      <UiTextarea
        v-model="form.description"
        :label="t('live.teacher.description')"
        :rows="3"
      />

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

      <UiCheckbox
        v-model="form.isRecurring"
        :label="t('tutoring.teacher.isRecurring')"
      />

      <UiSelect
        v-model="form.assistantId"
        :label="t('tutoring.teacher.assistantLabel')"
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

      <UiSelect
        v-model="form.studentIds"
        :label="t('tutoring.teacher.sessionStudent')"
        :multiple="true"
      >
        <option
          v-for="option in studentOptions"
          :key="option.id"
          :value="option.id"
        >
          {{ option.name }}
        </option>
      </UiSelect>

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

      <div class="live-form__actions">
        <UiButton variant="link" color="secondary" @click="onClose">{{
          t("common.cancel")
        }}</UiButton>
        <UiButton type="submit" color="primary" :loading="submitting">{{
          t("common.save")
        }}</UiButton>
      </div>
    </form>
  </UiDialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import UiDialog from "@/components/ui/UiDialog.vue";
import UiInput from "@/components/ui/UiInput.vue";
import UiTextarea from "@/components/ui/UiTextarea.vue";
import UiSelect from "@/components/ui/UiSelect.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiDateTimePicker from "@/components/ui/UiDateTimePicker.vue";
import UiCheckbox from "@/components/ui/UiCheckbox.vue";
import { useCoursesStore } from "@/stores/courses";
import { useTeacherAssistantsStore } from "@/stores/teacherAssistants";
import { useTeacherRosterStore } from "@/stores/teacherRoster";
import type {
  TeacherLiveSession,
  TeacherLiveSessionCreatePayload,
  TeacherLiveSessionUpdatePayload,
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
  assistantId: number | "";
  studentIds: number[];
  isRecurring: boolean;
}

const props = defineProps<{
  open: boolean;
  mode: "create" | "edit";
  session?: TeacherLiveSession | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "create", payload: TeacherLiveSessionCreatePayload): void;
  (e: "update", payload: TeacherLiveSessionUpdatePayload): void;
}>();

const { t } = useI18n();
const coursesStore = useCoursesStore();
const submitting = ref(false);

const form = reactive<FormState>({
  courseId: "",
  title: "",
  description: "",
  scheduledAt: "",
  durationMinutes: 60,
  provider: "zoom",
  joinUrl: "",
  providerConfig: {},
  assistantId: "",
  studentIds: [],
  isRecurring: false,
});

const assistantsStore = useTeacherAssistantsStore();
const rosterStore = useTeacherRosterStore();

const filteredAssistantOptions = computed(() => {
  return assistantsStore.assistants.map((assistant) => ({
    id: assistant.id,
    name: assistant.name,
  }));
});

const studentOptions = computed(() => {
  return rosterStore.students.map((student) => ({
    id: student.studentId,
    name: student.name,
    email: student.email,
  }));
});

const dialogTitle = computed(() =>
  props.mode === "create"
    ? t("live.teacher.createTitle")
    : t("live.teacher.editTitle"),
);

const courses = computed(() => coursesStore.list);

watch(
  () => props.open,
  (open) => {
    if (open) {
      initialise();
      if (!coursesStore.list.length) {
        coursesStore.fetchCourses().catch(() => {
          /* ignore load errors here */
        });
      }
      assistantsStore.loadAssistants(false).catch(() => {});
      rosterStore.loadStudents().catch(() => {});
    }
  },
);

function initialise() {
  if (props.session && props.mode === "edit") {
    form.courseId = props.session.courseId;
    form.title = props.session.title;
    form.description = props.session.description ?? "";
    form.scheduledAt = props.session.scheduledAt
      ? props.session.scheduledAt.slice(0, 16)
      : "";
    form.durationMinutes = props.session.durationMinutes ?? 60;
    form.provider = props.session.provider;
    form.joinUrl = props.session.joinUrl ?? "";
    form.providerConfig = Object.fromEntries(
      Object.entries(props.session.providerConfig ?? {}).map(([key, value]) => [
        key,
        typeof value === "string" ? value : (value?.toString() ?? ""),
      ]),
    );
    form.assistantId = props.session.assistantId ?? "";
    form.studentIds = props.session.studentIds ?? [];
    form.isRecurring = props.session.isRecurring ?? false;
  } else {
    form.courseId = "";
    form.title = "";
    form.description = "";
    form.scheduledAt = "";
    form.durationMinutes = 60;
    form.provider = "zoom";
    form.joinUrl = "";
    form.providerConfig = {};
    form.assistantId = "";
    form.studentIds = [];
    form.isRecurring = false;
  }
}

function onProviderChange() {
  form.providerConfig = {};
}

async function submit() {
  submitting.value = true;
  try {
    if (props.mode === "create") {
      const payload: TeacherLiveSessionCreatePayload = {
        courseId: Number(form.courseId),
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        provider: form.provider,
        providerConfig: normalisedProviderConfig(),
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        durationMinutes: form.durationMinutes,
        joinUrl: form.joinUrl || undefined,
        assistantId:
          form.assistantId === "" ? undefined : Number(form.assistantId),
        studentIds: form.studentIds.length > 0 ? form.studentIds : undefined,
        isRecurring: form.isRecurring,
      };
      emit("create", payload);
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
        assistantId:
          form.assistantId === "" ? undefined : Number(form.assistantId),
        studentIds: form.studentIds.length > 0 ? form.studentIds : undefined,
        isRecurring: form.isRecurring,
      };
      emit("update", payload);
    }
  } finally {
    submitting.value = false;
  }
}

function normalisedProviderConfig() {
  const cleaned = Object.fromEntries(
    Object.entries(form.providerConfig)
      .filter(([, value]) => value && value.toString().trim().length > 0)
      .map(([key, value]) => [key, value.toString().trim()]),
  );
  return Object.keys(cleaned).length ? cleaned : undefined;
}

function onClose() {
  emit("close");
}
</script>

<style scoped>
.live-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.live-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}
</style>
