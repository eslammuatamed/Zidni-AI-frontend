<template>
  <ThemePage :title="pageTitle" :subtitle="pageSubtitle">
    <template #actions>
      <UiButton
        variant="link"
        color="secondary"
        prepend-icon="ArrowLeftOutlined"
        @click="goBack"
      >
        {{ backLabel }}
      </UiButton>
    </template>

    <div v-if="isLoading" class="assignment-editor__loading">
      <UiSkeleton height="24px" width="40%" />
      <UiSkeleton height="320px" />
    </div>

    <UiCard v-else class="assignment-editor__card">
      <form class="assignment-editor__form" @submit.prevent="onSave">
        <UiAlert v-if="loadError" color="danger" variant="soft">
          {{ loadError }}
        </UiAlert>

        <section v-if="isCrossCourse" class="assignment-editor__grid">
          <UiSelect
            :model-value="selectedCourseId ?? ''"
            :label="t('teacher.assignments.fields.course')"
            :disabled="isEditMode"
            required
            @update:model-value="onCourseChange"
          >
            <option value="">{{ t('teacher.assignments.fields.coursePlaceholder') }}</option>
            <option
              v-for="course in courseOptions"
              :key="course.id"
              :value="course.id"
            >
              {{ course.title }}
            </option>
          </UiSelect>
          <UiSelect
            :model-value="selectedLessonId ?? ''"
            :label="t('teacher.assignments.fields.lesson')"
            :disabled="isEditMode || !selectedCourseId || lessonOptionsLoading"
            required
            @update:model-value="onLessonChange"
          >
            <option value="">
              {{
                lessonOptionsLoading
                  ? t('teacher.assignments.fields.lessonLoading')
                  : !selectedCourseId
                    ? t('teacher.assignments.fields.lessonPickCourseFirst')
                    : t('teacher.assignments.fields.lessonPlaceholder')
              }}
            </option>
            <option
              v-for="lesson in lessonOptions"
              :key="lesson.value"
              :value="lesson.value"
            >
              {{ lesson.label }}
            </option>
          </UiSelect>
        </section>

        <section class="assignment-editor__section">
          <UiInput
            v-model="form.title"
            :label="t('teacher.assignments.fields.title')"
            :placeholder="t('teacher.assignments.fields.titlePlaceholder')"
            :error="attempted && !form.title.trim() ? t('teacher.assignments.validation.titleRequired') : ''"
            required
          />
          <UiTextarea
            v-model="form.description"
            :label="t('teacher.assignments.fields.description')"
            :placeholder="t('teacher.assignments.fields.descriptionPlaceholder')"
            :rows="5"
            :error="attempted && !form.description.trim() ? t('teacher.assignments.validation.descriptionRequired') : ''"
            required
          />
        </section>

        <section class="assignment-editor__grid">
          <UiDateTimePicker
            v-model="form.dueAt"
            :label="t('teacher.assignments.fields.dueAt')"
            :error="attempted && !form.dueAt ? t('teacher.assignments.validation.dueAtRequired') : ''"
            required
          />
          <UiInput
            :model-value="form.maxScore"
            type="number"
            min="1"
            :label="t('teacher.assignments.fields.maxScore')"
            :error="attempted && !(form.maxScore > 0) ? t('teacher.assignments.validation.maxScoreRequired') : ''"
            required
            @update:model-value="onMaxScoreChange"
          />
        </section>

        <section class="assignment-editor__section">
          <h3 class="assignment-editor__section-title">
            {{ t('teacher.assignments.fields.attachments') }}
          </h3>
          <TeacherAssignmentAttachmentUploader
            :attachments="form.attachments"
            @update:attachments="onAttachmentsChange"
          />
        </section>

        <footer class="assignment-editor__footer">
          <UiButton
            variant="link"
            color="secondary"
            button-type="button"
            @click="goBack"
          >
            {{ t('teacher.assignments.editor.cancel') }}
          </UiButton>
          <UiButton
            button-type="submit"
            color="primary"
            :loading="submitting"
            :disabled="!isFormReady"
          >
            {{ submitting ? t('teacher.assignments.editor.saving') : t('teacher.assignments.editor.save') }}
          </UiButton>
        </footer>
      </form>
    </UiCard>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import ThemePage from '@/layout/theme/ThemePage.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiTextarea from '@/components/ui/UiTextarea.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiSkeleton from '@/components/ui/UiSkeleton.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiDateTimePicker from '@/components/ui/UiDateTimePicker.vue';
import TeacherAssignmentAttachmentUploader from '@/components/teacher/assignments/TeacherAssignmentAttachmentUploader.vue';
import { useLearningStore } from '@/stores/learning';
import { useCoursesStore } from '@/stores/courses';
import { useToast } from '@/composables/useToast';
import { handleApiError } from '@/composables/useApiError';
import type {
  Assignment,
  AssignmentAttachment,
  AssignmentRequestPayload
} from '@/services/learning';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const learning = useLearningStore();
const courses = useCoursesStore();
const toast = useToast();

const routeCourseId = computed(() => {
  const raw = route.params.courseId;
  if (typeof raw !== 'string') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
});
const routeLessonId = computed(() => {
  const raw = route.params.lessonId;
  if (typeof raw !== 'string') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
});
const routeAssignmentId = computed(() => {
  const raw = route.params.assignmentId;
  if (typeof raw !== 'string') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
});

const isCrossCourse = computed(() => routeCourseId.value === null);
const isEditMode = computed(() => routeAssignmentId.value !== null);

const selectedCourseId = ref<number | null>(null);
const selectedLessonId = ref<number | null>(null);
const lessonOptionsLoading = ref(false);

const form = reactive({
  title: '',
  description: '',
  dueAt: '' as string,
  maxScore: 100 as number,
  attachments: [] as AssignmentAttachment[]
});

const attempted = ref(false);
const submitting = ref(false);
const isLoading = ref(true);
const loadError = ref('');

const courseOptions = computed(() => courses.list);

const lessonOptions = computed(() => {
  if (!selectedCourseId.value) return [];
  if (!courses.current || courses.current.id !== selectedCourseId.value) return [];
  const options: { value: number; label: string }[] = [];
  courses.current.modules.forEach((module) => {
    module.lessons.forEach((lesson) => {
      options.push({ value: lesson.id, label: `${module.title} — ${lesson.title}` });
    });
  });
  return options;
});

const lessonTitle = computed(() => {
  if (!courses.current || !selectedLessonId.value) return '';
  for (const module of courses.current.modules) {
    const match = module.lessons.find((lesson) => lesson.id === selectedLessonId.value);
    if (match) return match.title;
  }
  return '';
});

const pageTitle = computed(() =>
  isEditMode.value
    ? t('teacher.assignments.editor.editTitle')
    : t('teacher.assignments.editor.createTitle')
);

const pageSubtitle = computed(() =>
  lessonTitle.value
    ? t('teacher.assignments.editor.lessonHeading', { lesson: lessonTitle.value })
    : ''
);

const backLabel = computed(() =>
  isCrossCourse.value
    ? t('teacher.assignments.backToList')
    : t('teacher.assignments.backToCourse')
);

const isFormReady = computed(() => {
  if (submitting.value) return false;
  if (isCrossCourse.value && (!selectedCourseId.value || !selectedLessonId.value)) {
    return false;
  }
  return true;
});

function toDateTimeLocalInput(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMinutes = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offsetMinutes * 60000);
  return local.toISOString().slice(0, 16);
}

function toIsoFromLocalInput(value: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString();
}

function onMaxScoreChange(value: string | number | null) {
  const parsed = Number(value);
  form.maxScore = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function onAttachmentsChange(next: AssignmentAttachment[]) {
  form.attachments = next;
}

async function onCourseChange(value: string | number | null) {
  const courseId = value === '' || value === null ? null : Number(value);
  selectedCourseId.value = Number.isFinite(courseId) ? courseId : null;
  selectedLessonId.value = null;
  if (selectedCourseId.value) {
    lessonOptionsLoading.value = true;
    try {
      await courses.fetchCourse(selectedCourseId.value);
    } catch (error) {
      handleApiError(error, { fallback: t('teacher.assignments.errors.generic') });
    } finally {
      lessonOptionsLoading.value = false;
    }
  }
}

function onLessonChange(value: string | number | null) {
  const lessonId = value === '' || value === null ? null : Number(value);
  selectedLessonId.value = Number.isFinite(lessonId) ? lessonId : null;
}

function populateForm(assignment: Assignment) {
  form.title = assignment.title;
  form.description = assignment.description ?? '';
  form.dueAt = assignment.dueAt ? toDateTimeLocalInput(assignment.dueAt) : '';
  form.maxScore = assignment.maxScore ?? 100;
  form.attachments = [...(assignment.attachments ?? [])];
  selectedCourseId.value = assignment.courseId;
  selectedLessonId.value = assignment.lessonId;
}

async function findAssignment(assignmentId: number): Promise<Assignment | null> {
  let existing = learning.teacherAssignments.find((assignment) => assignment.id === assignmentId);
  if (!existing) {
    await learning.loadTeacherAssignments();
    existing = learning.teacherAssignments.find((assignment) => assignment.id === assignmentId);
  }
  return existing ?? null;
}

async function loadInitialData() {
  isLoading.value = true;
  loadError.value = '';
  try {
    if (isCrossCourse.value) {
      if (!courses.list.length) {
        await courses.fetchCourses();
      }
      if (isEditMode.value && routeAssignmentId.value !== null) {
        const existing = await findAssignment(routeAssignmentId.value);
        if (!existing) {
          loadError.value = t('teacher.assignments.errors.notFound');
          return;
        }
        populateForm(existing);
        if (!courses.current || courses.current.id !== existing.courseId) {
          await courses.fetchCourse(existing.courseId);
        }
      }
    } else {
      if (routeCourseId.value !== null) {
        selectedCourseId.value = routeCourseId.value;
        if (!courses.current || courses.current.id !== routeCourseId.value) {
          await courses.fetchCourse(routeCourseId.value);
        }
      }
      if (routeLessonId.value !== null) {
        selectedLessonId.value = routeLessonId.value;
      }
      if (isEditMode.value && routeAssignmentId.value !== null) {
        const existing = await findAssignment(routeAssignmentId.value);
        if (!existing) {
          loadError.value = t('teacher.assignments.errors.notFound');
          return;
        }
        populateForm(existing);
      }
    }
  } catch (error) {
    loadError.value = handleApiError(error, {
      fallback: t('teacher.assignments.errors.generic'),
      useToast: false
    });
  } finally {
    isLoading.value = false;
  }
}

function goBack() {
  if (isCrossCourse.value) {
    router.push({ name: 'teacher-learning' });
    return;
  }
  if (selectedLessonId.value !== null) {
    learning.setPendingAssignmentsDialog(selectedLessonId.value);
  }
  router.push({
    name: 'teacher-course',
    params: { courseId: String(selectedCourseId.value ?? routeCourseId.value ?? '') }
  });
}

async function onSave() {
  attempted.value = true;
  if (
    !form.title.trim() ||
    !form.description.trim() ||
    !form.dueAt ||
    !(form.maxScore > 0)
  ) {
    return;
  }
  if (!selectedLessonId.value) {
    return;
  }
  const dueIso = toIsoFromLocalInput(form.dueAt);
  if (!dueIso) {
    return;
  }
  const payload: AssignmentRequestPayload = {
    lessonId: selectedLessonId.value,
    title: form.title.trim(),
    description: form.description.trim(),
    dueAt: dueIso,
    maxScore: form.maxScore,
    attachments: form.attachments
  };
  submitting.value = true;
  try {
    if (isEditMode.value && routeAssignmentId.value !== null) {
      await learning.updateAssignment(routeAssignmentId.value, payload);
      toast.success(t('teacher.assignments.toast.updated'));
    } else {
      await learning.createAssignment(payload);
      toast.success(t('teacher.assignments.toast.created'));
    }
    goBack();
  } catch (error) {
    handleApiError(error, { fallback: t('teacher.assignments.errors.generic') });
  } finally {
    submitting.value = false;
  }
}

// Re-load the form when the route changes (e.g. switching from one assignment to another).
watch(
  () => [routeCourseId.value, routeLessonId.value, routeAssignmentId.value] as const,
  () => {
    void loadInitialData();
  }
);

onMounted(() => {
  void loadInitialData();
});
</script>

<style scoped>
.assignment-editor__loading {
  display: grid;
  gap: var(--sakai-space-4);
}

.assignment-editor__card {
  padding: var(--sakai-space-4);
}

.assignment-editor__form {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-5);
}

.assignment-editor__section {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
}

.assignment-editor__section-title {
  margin: 0;
  font-size: 1rem;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
}

.assignment-editor__grid {
  display: grid;
  gap: var(--sakai-space-3);
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}

.assignment-editor__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--sakai-space-3);
}

@media (max-width: 720px) {
  .assignment-editor__grid {
    grid-template-columns: 1fr;
  }
}
</style>
