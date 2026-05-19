<template>
  <UiDialog
    :model-value="modelValue"
    :title="title"
    width="560px"
    @update:model-value="onDialogUpdate"
  >
    <form v-if="assignment" class="student-submit__form" @submit.prevent="onSubmit">
      <section
        v-if="isResubmit && assignment.feedback"
        class="student-submit__feedback"
      >
        <h4 class="student-submit__heading">
          {{ t('student.assignments.submit.teacherFeedbackHeading') }}
        </h4>
        <p class="student-submit__feedback-body">{{ assignment.feedback }}</p>
      </section>

      <section>
        <h4 class="student-submit__heading">
          {{ t('student.assignments.submit.attachments') }}
        </h4>
        <UiFileUpload
          v-model="selectedFiles"
          multiple
          :label="t('teacher.assignments.upload.dropHint')"
          :button-label="t('teacher.assignments.upload.browse')"
          :hint="t('teacher.assignments.upload.sizeHint')"
          :disabled="anyUploading || submitting"
          @change="onFilesChange"
        />
        <UiAlert v-if="uploadError" color="danger" variant="soft" class="student-submit__alert">
          {{ uploadError }}
        </UiAlert>
        <UiAlert
          v-if="attempted && !attachments.length"
          color="warning"
          variant="soft"
          class="student-submit__alert"
        >
          {{ t('student.assignments.submit.attachmentsRequired') }}
        </UiAlert>
        <AssignmentAttachmentList
          v-if="attachments.length || anyUploading"
          class="student-submit__list"
          :attachments="attachments"
          :uploading="uploadingMap"
          @remove="onRemoveAttachment"
        />
      </section>

      <UiTextarea
        v-model="form.notes"
        :label="t('student.assignments.submit.notes')"
        :placeholder="t('student.assignments.submit.notesPlaceholder')"
        :rows="4"
      />

      <footer class="student-submit__footer">
        <UiButton
          variant="link"
          color="secondary"
          button-type="button"
          @click="onDialogUpdate(false)"
        >
          {{ t('student.assignments.submit.cancel') }}
        </UiButton>
        <UiButton
          button-type="submit"
          color="primary"
          :loading="submitting"
          :disabled="!canSubmit"
        >
          {{ submitting
            ? t('student.assignments.submit.sending')
            : t('student.assignments.submit.send') }}
        </UiButton>
      </footer>
    </form>
  </UiDialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import UiDialog from '@/components/ui/UiDialog.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiTextarea from '@/components/ui/UiTextarea.vue';
import UiFileUpload from '@/components/ui/UiFileUpload.vue';
import AssignmentAttachmentList from '@/components/shared/assignments/AssignmentAttachmentList.vue';
import { useLearningStore } from '@/stores/learning';
import { useToast } from '@/composables/useToast';
import { handleApiError } from '@/composables/useApiError';
import { getHttpStatus } from '@/utils/httpError';
import type {
  Assignment,
  AssignmentAttachment,
  AssignmentSubmission
} from '@/services/learning';

const props = defineProps<{
  modelValue: boolean;
  assignment: Assignment | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submitted: [submission: AssignmentSubmission];
}>();

const { t } = useI18n();
const learning = useLearningStore();
const toast = useToast();

const attachments = ref<AssignmentAttachment[]>([]);
const selectedFiles = ref<File[]>([]);
const uploadingMap = ref<Record<string, number>>({});
const uploadError = ref('');
const submitting = ref(false);
const attempted = ref(false);

const form = reactive({
  notes: ''
});

const isResubmit = computed(
  () => props.assignment?.submissionStatus === 'resubmission_requested'
);

const title = computed(() =>
  isResubmit.value
    ? t('student.assignments.submit.resubmitTitle')
    : t('student.assignments.submit.title')
);

const anyUploading = computed(() => Object.keys(uploadingMap.value).length > 0);

const canSubmit = computed(
  () => !submitting.value && !anyUploading.value && attachments.value.length > 0
);

function resetForm() {
  attachments.value = [];
  selectedFiles.value = [];
  uploadingMap.value = {};
  uploadError.value = '';
  form.notes = '';
  attempted.value = false;
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      resetForm();
    }
  }
);

async function onFilesChange(files: File[]) {
  if (!files.length) return;
  uploadError.value = '';
  for (const file of files) {
    if (file.name in uploadingMap.value) continue;
    uploadingMap.value = { ...uploadingMap.value, [file.name]: 0 };
    try {
      const attachment = await learning.uploadStudentAttachment(file, (progress) => {
        uploadingMap.value = { ...uploadingMap.value, [file.name]: progress };
      });
      attachments.value = [...attachments.value, attachment];
    } catch (error) {
      uploadError.value = handleApiError(error, {
        fallback: t('student.assignments.toast.uploadFailed'),
        useToast: false
      });
    } finally {
      const next = { ...uploadingMap.value };
      delete next[file.name];
      uploadingMap.value = next;
    }
  }
  selectedFiles.value = [];
}

function onRemoveAttachment(index: number) {
  attachments.value = attachments.value.filter((_, i) => i !== index);
}

function onDialogUpdate(value: boolean) {
  emit('update:modelValue', value);
}

async function onSubmit() {
  attempted.value = true;
  if (!props.assignment || !canSubmit.value) return;
  submitting.value = true;
  try {
    const submission = await learning.submitStudentAssignment(props.assignment.id, {
      assignmentId: props.assignment.id,
      attachments: attachments.value,
      notes: form.notes
    });
    toast.success(
      isResubmit.value
        ? t('student.assignments.toast.resubmitted')
        : t('student.assignments.toast.submitted')
    );
    emit('submitted', submission);
    emit('update:modelValue', false);
  } catch (error) {
    const status = getHttpStatus(error);
    handleApiError(error, {
      fallback:
        status === 409
          ? t('student.assignments.errors.alreadySubmitted')
          : t('student.assignments.errors.generic')
    });
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.student-submit__form {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
}

.student-submit__heading {
  margin: 0 0 var(--sakai-space-2);
  font-size: 0.95rem;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
}

.student-submit__feedback {
  padding: var(--sakai-space-3);
  border-radius: var(--sakai-border-radius-lg);
  border: 1px solid color-mix(in srgb, var(--sakai-warning) 35%, transparent);
  background: color-mix(in srgb, var(--sakai-warning) 10%, var(--sakai-surface) 90%);
}

.student-submit__feedback-body {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.5;
  color: var(--sakai-text-color);
}

.student-submit__list {
  margin-top: var(--sakai-space-2);
}

.student-submit__alert {
  margin-top: var(--sakai-space-2);
}

.student-submit__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--sakai-space-3);
}
</style>
