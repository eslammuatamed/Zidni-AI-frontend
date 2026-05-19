<template>
  <UiDialog
    :model-value="modelValue"
    :title="title"
    width="520px"
    @update:model-value="onDialogUpdate"
  >
    <form v-if="submission" class="teacher-grade-dialog__form" @submit.prevent="onSubmit">
      <UiSelect
        :model-value="form.status"
        :label="t('teacher.assignments.grade.status')"
        @update:model-value="onStatusChange"
      >
        <option v-for="option in statusOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </UiSelect>
      <UiInput
        :model-value="form.score"
        type="number"
        min="0"
        :max="maxScore"
        :label="t('teacher.assignments.grade.score')"
        :hint="t('teacher.assignments.grade.scoreHint', { max: maxScore })"
        :error="scoreError"
        required
        @update:model-value="onScoreChange"
      />
      <UiTextarea
        v-model="form.feedback"
        :label="t('teacher.assignments.grade.feedback')"
        :placeholder="t('teacher.assignments.grade.feedbackPlaceholder')"
        :rows="4"
      />
      <div class="teacher-grade-dialog__actions">
        <UiButton variant="link" color="secondary" @click.prevent="onDialogUpdate(false)">
          {{ t('common.cancel') }}
        </UiButton>
        <UiButton
          button-type="submit"
          color="primary"
          :loading="submitting"
          :disabled="!isValid"
        >
          {{ t('teacher.assignments.grade.save') }}
        </UiButton>
      </div>
    </form>
  </UiDialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import UiDialog from '@/components/ui/UiDialog.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiTextarea from '@/components/ui/UiTextarea.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import { useLearningStore } from '@/stores/learning';
import { useToast } from '@/composables/useToast';
import { handleApiError } from '@/composables/useApiError';
import type {
  AssignmentSubmission,
  AssignmentSubmissionStatus
} from '@/services/learning';

const props = defineProps<{
  modelValue: boolean;
  submission: AssignmentSubmission | null;
  maxScore: number;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  graded: [submission: AssignmentSubmission];
}>();

const { t } = useI18n();
const learning = useLearningStore();
const toast = useToast();

const submitting = ref(false);

const form = reactive({
  status: 'graded' as AssignmentSubmissionStatus,
  score: 0 as number,
  feedback: ''
});

const title = computed(() =>
  props.submission
    ? t('teacher.assignments.grade.titleFor', { student: props.submission.studentName })
    : t('teacher.assignments.grade.title')
);

const statusOptions = computed(() => [
  { value: 'graded', label: t('teacher.assignments.status.graded') },
  { value: 'resubmission_requested', label: t('teacher.assignments.status.resubmissionRequested') },
  { value: 'submitted', label: t('teacher.assignments.status.submitted') }
]);

const scoreError = computed(() => {
  if (form.score < 0) return t('teacher.assignments.validation.maxScoreRequired');
  if (form.score > props.maxScore) return t('teacher.assignments.grade.scoreHint', { max: props.maxScore });
  return '';
});

const isValid = computed(() => !scoreError.value && form.score >= 0);

watch(
  () => props.submission,
  (submission) => {
    if (!submission) return;
    form.status = submission.status;
    form.score = submission.score ?? 0;
    form.feedback = submission.feedback ?? '';
  },
  { immediate: true }
);

function onStatusChange(value: string | number | null) {
  form.status = (value as AssignmentSubmissionStatus) ?? 'graded';
}

function onScoreChange(value: string | number | null) {
  const parsed = Number(value);
  form.score = Number.isFinite(parsed) ? parsed : 0;
}

function onDialogUpdate(value: boolean) {
  emit('update:modelValue', value);
}

async function onSubmit() {
  if (!props.submission || submitting.value || !isValid.value) return;
  submitting.value = true;
  try {
    const graded = await learning.gradeAssignment(props.submission.id, {
      status: form.status,
      score: form.score,
      feedback: form.feedback
    });
    toast.success(t('teacher.assignments.toast.graded'));
    emit('graded', graded);
    emit('update:modelValue', false);
  } catch (error) {
    handleApiError(error, { fallback: t('teacher.assignments.errors.generic') });
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.teacher-grade-dialog__form {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
}

.teacher-grade-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--sakai-space-3);
}
</style>
