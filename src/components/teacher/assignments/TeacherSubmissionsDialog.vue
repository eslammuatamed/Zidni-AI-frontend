<template>
  <UiDialog
    :model-value="modelValue"
    :title="title"
    width="720px"
    @update:model-value="onDialogUpdate"
  >
    <div v-if="loadError" class="teacher-submissions-dialog">
      <UiAlert color="danger" variant="soft">
        <div class="flex items-center justify-between gap-3">
          <span>{{ loadError }}</span>
          <UiButton variant="link" color="primary" @click="loadSubmissions">
            {{ t('common.retry') }}
          </UiButton>
        </div>
      </UiAlert>
    </div>

    <div v-else-if="loading" class="teacher-submissions-dialog">
      <UiSkeleton height="64px" />
      <UiSkeleton height="64px" />
    </div>

    <UiAlert
      v-else-if="!submissions.length"
      color="info"
      variant="soft"
    >
      {{ t('teacher.assignments.submissions.empty') }}
    </UiAlert>

    <ul v-else class="teacher-submissions-dialog__list">
      <li
        v-for="submission in submissions"
        :key="submission.id"
        class="teacher-submissions-dialog__item"
      >
        <header class="teacher-submissions-dialog__item-header">
          <div>
            <h4 class="teacher-submissions-dialog__item-name">
              {{ submission.studentName }}
            </h4>
            <p class="teacher-submissions-dialog__item-meta">
              {{ formatDateTime(submission.submittedAt) }}
            </p>
          </div>
          <UiTag size="sm" :color="statusColor(submission.status)">
            {{ t(`teacher.assignments.status.${statusKey(submission.status)}`) }}
          </UiTag>
        </header>

        <div class="teacher-submissions-dialog__item-row">
          <span class="teacher-submissions-dialog__label">
            {{ t('teacher.assignments.submissions.score') }}:
          </span>
          <span>{{ submission.score ?? '—' }} / {{ assignment?.maxScore ?? '—' }}</span>
        </div>

        <div class="teacher-submissions-dialog__item-row">
          <span class="teacher-submissions-dialog__label">
            {{ t('teacher.assignments.submissions.attachments') }}:
          </span>
          <span
            v-if="!submission.attachments?.length"
            class="text-content-tertiary"
          >
            {{ t('teacher.assignments.submissions.attachmentsNone') }}
          </span>
          <ul v-else class="teacher-submissions-dialog__attachments">
            <li v-for="attachment in submission.attachments" :key="attachment.fileKey">
              <a :href="attachment.fileUrl" target="_blank" rel="noopener">
                {{ attachment.fileName }}
              </a>
              <span class="teacher-submissions-dialog__size">
                ({{ formatFileSize(attachment.fileSizeBytes) }})
              </span>
            </li>
          </ul>
        </div>

        <p
          v-if="submission.feedback"
          class="teacher-submissions-dialog__feedback"
        >
          {{ submission.feedback }}
        </p>

        <div class="teacher-submissions-dialog__actions">
          <UiButton
            variant="link"
            color="primary"
            prepend-icon="EditOutlined"
            @click="onGrade(submission)"
          >
            {{ t('teacher.assignments.submissions.grade') }}
          </UiButton>
        </div>
      </li>
    </ul>

    <template #footer>
      <UiButton variant="link" color="secondary" @click="onDialogUpdate(false)">
        {{ t('common.close') }}
      </UiButton>
    </template>
  </UiDialog>

  <TeacherGradeSubmissionDialog
    v-model="gradeDialogOpen"
    :submission="selectedSubmission"
    :max-score="assignment?.maxScore ?? 0"
    @graded="onGraded"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import UiDialog from '@/components/ui/UiDialog.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiTag from '@/components/ui/UiTag.vue';
import UiSkeleton from '@/components/ui/UiSkeleton.vue';
import TeacherGradeSubmissionDialog from './TeacherGradeSubmissionDialog.vue';
import { useLearningStore } from '@/stores/learning';
import { handleApiError } from '@/composables/useApiError';
import { formatDateTime, formatFileSize } from '@/utils/formatters';
import type {
  Assignment,
  AssignmentSubmission,
  AssignmentSubmissionStatus
} from '@/services/learning';

const props = defineProps<{
  modelValue: boolean;
  assignment: Assignment | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const { t } = useI18n();
const learning = useLearningStore();

const loading = ref(false);
const loadError = ref<string>('');
const gradeDialogOpen = ref(false);
const selectedSubmission = ref<AssignmentSubmission | null>(null);

const title = computed(() =>
  props.assignment
    ? t('teacher.assignments.submissions.titleFor', { assignment: props.assignment.title })
    : t('teacher.assignments.submissions.title')
);

const submissions = computed(() => learning.assignmentSubmissions);

async function loadSubmissions() {
  if (!props.assignment) return;
  loading.value = true;
  loadError.value = '';
  try {
    await learning.loadAssignmentSubmissions(props.assignment.id);
  } catch (error) {
    loadError.value = handleApiError(error, {
      fallback: t('teacher.assignments.submissions.loadFailed'),
      useToast: false
    });
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.modelValue, props.assignment?.id] as const,
  ([open, assignmentId]) => {
    if (open && assignmentId) {
      void loadSubmissions();
    } else if (!open) {
      learning.clearAssignmentSubmissions();
    }
  },
  { immediate: true }
);

function onDialogUpdate(value: boolean) {
  emit('update:modelValue', value);
}

function onGrade(submission: AssignmentSubmission) {
  selectedSubmission.value = submission;
  gradeDialogOpen.value = true;
}

function onGraded() {
  void loadSubmissions();
}

function statusKey(status: AssignmentSubmissionStatus): string {
  if (status === 'resubmission_requested') return 'resubmissionRequested';
  return status;
}

function statusColor(status: AssignmentSubmissionStatus): 'info' | 'warning' | 'success' {
  if (status === 'graded') return 'success';
  if (status === 'resubmission_requested') return 'warning';
  return 'info';
}
</script>

<style scoped>
.teacher-submissions-dialog {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
}

.teacher-submissions-dialog__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
}

.teacher-submissions-dialog__item {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-2);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 75%, transparent);
  background: color-mix(in srgb, var(--sakai-surface) 96%, transparent);
}

.teacher-submissions-dialog__item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--sakai-space-3);
}

.teacher-submissions-dialog__item-name {
  margin: 0;
  font-size: 0.95rem;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
}

.teacher-submissions-dialog__item-meta {
  margin: var(--sakai-space-1) 0 0;
  font-size: 0.85rem;
  color: var(--sakai-text-color-tertiary);
}

.teacher-submissions-dialog__item-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sakai-space-2);
  font-size: 0.9rem;
}

.teacher-submissions-dialog__label {
  font-weight: var(--sakai-font-weight-medium);
  color: var(--sakai-text-color);
}

.teacher-submissions-dialog__attachments {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-1);
}

.teacher-submissions-dialog__size {
  color: var(--sakai-text-color-tertiary);
  font-size: 0.8rem;
  margin-inline-start: var(--sakai-space-2);
}

.teacher-submissions-dialog__feedback {
  margin: var(--sakai-space-2) 0 0;
  padding: var(--sakai-space-2) var(--sakai-space-3);
  border-radius: var(--sakai-border-radius-md);
  background: color-mix(in srgb, var(--sakai-border-color) 25%, var(--sakai-surface) 75%);
  font-size: 0.9rem;
  color: var(--sakai-text-color);
  line-height: 1.5;
  white-space: pre-wrap;
}

.teacher-submissions-dialog__actions {
  display: flex;
  justify-content: flex-end;
}
</style>
