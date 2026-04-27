<template>
  <ThemePage :title="pageTitle" :subtitle="pageSubtitle">
    <div class="user-feedback">
      <UiCard class="user-feedback__card" :title="t('feedback.cardTitle')" :subtitle="t('feedback.cardSubtitle')">
        <div class="user-feedback__section">
          <p class="user-feedback__description">{{ t(`feedback.description.${props.audience}`) }}</p>
        </div>
        <div class="user-feedback__section">
          <span class="user-feedback__label">{{ t('feedback.typeLabel') }}</span>
          <UiSegmentedControl v-model="form.type" :options="typeOptions" full-width />
        </div>
        <UiInput
          v-model="form.subject"
          :label="t('feedback.subjectLabel')"
          :placeholder="t('feedback.subjectPlaceholder')"
          :hint="t('feedback.subjectHint')"
          maxlength="200"
        />
        <UiTextarea
          v-model="form.message"
          :label="t('feedback.messageLabel')"
          :placeholder="messagePlaceholder"
          :rows="8"
          :error="state.messageError"
          maxlength="4000"
        />
        <div class="user-feedback__section">
          <span class="user-feedback__label">{{ t('feedback.attachmentLabel') }}</span>
          <UiFileUpload
            v-model="attachmentFiles"
            :accept="attachmentAccept"
            :disabled="attachmentState.uploading || state.submitting"
            :label="t('feedback.attachmentDropLabel')"
            :hint="t('feedback.attachmentHint')"
            @change="onAttachmentChange"
            @remove="onAttachmentRemove"
          />
          <UiAlert v-if="attachmentState.error" color="danger" variant="soft">{{ attachmentState.error }}</UiAlert>
          <p v-else-if="attachmentState.uploading" class="user-feedback__uploading">{{ t('feedback.attachmentUploading') }}</p>
          <p v-else-if="attachmentState.result" class="user-feedback__upload-ready">
            {{ t('feedback.attachmentReady') }}
            <a :href="attachmentState.result.url" target="_blank" rel="noopener">{{ t('feedback.attachmentPreview') }}</a>
          </p>
        </div>
        <UiAlert v-if="state.serverError" color="danger" variant="soft">{{ state.serverError }}</UiAlert>
        <div class="user-feedback__actions">
          <UiButton color="primary" :disabled="!canSubmit" @click="handleSubmit">
            {{ state.submitting ? t('feedback.sending') : t('feedback.submit') }}
          </UiButton>
          <UiButton variant="outline" color="secondary" :disabled="!isDirty || state.submitting" @click="clearForm">
            {{ t('feedback.reset') }}
          </UiButton>
        </div>
        <div class="user-feedback__section user-feedback__history">
          <h3 class="user-feedback__history-title">{{ t('feedback.history.title') }}</h3>
          <UiAlert v-if="history.error" color="danger" variant="soft">{{ history.error }}</UiAlert>
          <p v-else-if="history.loading" class="user-feedback__history-status">{{ t('feedback.history.loading') }}</p>
          <p v-else-if="!history.items.length" class="user-feedback__history-status">{{ t('feedback.history.empty') }}</p>
          <ul v-else class="user-feedback__history-list">
            <li v-for="item in history.items" :key="item.id" class="user-feedback__history-item">
              <div class="user-feedback__history-meta">
                <UiTag :color="item.type === 'COMPLAINT' ? 'danger' : 'success'" size="sm">
                  {{ labelByType[item.type] }}
                </UiTag>
                <span class="user-feedback__history-date">{{ formatDateTime(item.createdAt) }}</span>
              </div>
              <h4 v-if="item.subject" class="user-feedback__history-subject">{{ item.subject }}</h4>
              <p class="user-feedback__history-message">{{ item.message }}</p>
              <a
                v-if="item.attachmentUrl"
                :href="item.attachmentUrl"
                target="_blank"
                rel="noopener"
                class="user-feedback__history-link"
              >
                {{ t('feedback.history.viewAttachment') }}
              </a>
              <div v-if="item.replies.length" class="user-feedback__history-thread">
                <div
                  v-for="reply in item.replies"
                  :key="`${item.id}-${reply.id ?? reply.createdAt ?? 'legacy'}`"
                  class="user-feedback__history-reply"
                >
                  <div class="user-feedback__history-reply-header">
                    <UiIcon name="MessageOutlined" :size="16" />
                    <span>{{ replyAuthorLabel(reply) }}</span>
                    <span v-if="reply.createdAt" class="user-feedback__history-reply-date">
                      {{ formatDateTime(reply.createdAt) }}
                    </span>
                  </div>
                  <p v-if="reply.message" class="user-feedback__history-reply-message">{{ reply.message }}</p>
                  <a
                    v-if="reply.attachmentUrl"
                    :href="reply.attachmentUrl"
                    target="_blank"
                    rel="noopener"
                    class="user-feedback__history-link"
                  >
                    {{ t('feedback.history.viewReplyAttachment') }}
                  </a>
                </div>
              </div>
              <div class="user-feedback__history-actions">
                <UiButton size="sm" variant="ghost" color="primary" @click="toggleReplyForm(item.id)">
                  {{ replyForms[item.id]?.open ? t('feedback.history.cancelReply') : t('feedback.history.replyAction') }}
                </UiButton>
              </div>
              <div v-if="replyForms[item.id]?.open" class="user-feedback__history-reply-form">
                <UiTextarea
                  v-model="replyForms[item.id].message"
                  :label="t('feedback.history.replyLabel')"
                  :placeholder="t('feedback.history.replyPlaceholder')"
                  :rows="5"
                  maxlength="4000"
                />
                <UiFileUpload
                  v-model="replyForms[item.id].files"
                  :accept="attachmentAccept"
                  :disabled="replyForms[item.id].attachment.uploading || replyForms[item.id].submitting"
                  :label="t('feedback.history.replyAttachmentDropLabel')"
                  :hint="t('feedback.history.replyAttachmentHint')"
                  @change="onReplyAttachmentChange(item.id, $event)"
                  @remove="onReplyAttachmentRemove(item.id)"
                />
                <UiAlert v-if="replyForms[item.id].attachment.error" color="danger" variant="soft">
                  {{ replyForms[item.id].attachment.error }}
                </UiAlert>
                <p v-else-if="replyForms[item.id].attachment.uploading" class="user-feedback__history-uploading">
                  {{ t('feedback.history.replyAttachmentUploading') }}
                </p>
                <p v-else-if="replyForms[item.id].attachment.result" class="user-feedback__history-upload-ready">
                  {{ t('feedback.history.replyAttachmentReady') }}
                  <a
                    :href="replyForms[item.id].attachment.result?.url"
                    target="_blank"
                    rel="noopener"
                  >
                    {{ t('feedback.history.replyAttachmentPreview') }}
                  </a>
                </p>
                <UiAlert v-if="replyForms[item.id].error" color="danger" variant="soft">
                  {{ replyForms[item.id].error }}
                </UiAlert>
                <div class="user-feedback__history-reply-actions">
                  <UiButton
                    color="primary"
                    :disabled="replyForms[item.id].submitting || replyForms[item.id].attachment.uploading"
                    @click="submitReply(item)"
                  >
                    {{ replyForms[item.id].submitting ? t('feedback.history.sendingReply') : t('feedback.history.sendReply') }}
                  </UiButton>
                  <UiButton variant="ghost" color="secondary" :disabled="replyForms[item.id].submitting" @click="closeReplyForm(item.id)">
                    {{ t('feedback.history.cancelReply') }}
                  </UiButton>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </UiCard>
    </div>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { isAxiosError } from 'axios';
import ThemePage from '@/layout/theme/ThemePage.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiSegmentedControl from '@/components/ui/UiSegmentedControl.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiTextarea from '@/components/ui/UiTextarea.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiFileUpload from '@/components/ui/UiFileUpload.vue';
import UiTag from '@/components/ui/UiTag.vue';
import UiIcon from '@/components/ui/UiIcon.vue';
import { useToast } from '@/composables/useToast';
import { formatDateTime } from '@/utils/formatters';
import {
  submitFeedback,
  fetchUserFeedback,
  uploadFeedbackAttachment,
  replyToUserFeedback,
  type FeedbackType,
  type FeedbackAttachmentUploadResult,
  type FeedbackResponse,
  type FeedbackReplyItem,
  type FeedbackReplyRole
} from '@/services/feedback';

const props = defineProps<{ audience: 'teacher' | 'assistant' | 'student' }>();

const { t } = useI18n();
const toast = useToast();

const attachmentAccept = '.pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt';

const form = reactive({
  type: 'COMPLAINT' as FeedbackType,
  subject: '',
  message: ''
});

const state = reactive({
  submitting: false,
  serverError: '',
  messageError: ''
});

const attachmentFiles = ref<File[]>([]);
const attachmentState = reactive<{ uploading: boolean; error: string; result: FeedbackAttachmentUploadResult | null }>(
  {
    uploading: false,
    error: '',
    result: null
  }
);

const history = reactive<{ loading: boolean; error: string; items: FeedbackResponse[] }>(
  {
    loading: false,
    error: '',
    items: []
  }
);

interface ReplyFormState {
  open: boolean;
  message: string;
  submitting: boolean;
  error: string;
  attachment: {
    uploading: boolean;
    error: string;
    result: FeedbackAttachmentUploadResult | null;
  };
  files: File[];
}

const replyForms = reactive<Record<number, ReplyFormState>>({});

const ensureReplyForm = (id: number) => {
  if (!replyForms[id]) {
    replyForms[id] = {
      open: false,
      message: '',
      submitting: false,
      error: '',
      attachment: {
        uploading: false,
        error: '',
        result: null
      },
      files: []
    };
  }
  return replyForms[id];
};

const pageTitle = computed(() => t(`feedback.title.${props.audience}`));
const pageSubtitle = computed(() => t(`feedback.subtitle.${props.audience}`));
const messagePlaceholder = computed(() => t(`feedback.messagePlaceholder.${props.audience}`));
const typeOptions = computed(() => [
  { label: t('feedback.types.complaint'), value: 'COMPLAINT', icon: 'FrownOutlined' },
  { label: t('feedback.types.suggestion'), value: 'SUGGESTION', icon: 'BulbOutlined' }
]);

const labelByType = computed(() => ({
  COMPLAINT: t('feedback.types.complaint'),
  SUGGESTION: t('feedback.types.suggestion')
}));

const replyRoleLabel = (role: FeedbackReplyRole) => {
  switch (role) {
    case 'TEACHER':
      return t('feedback.roles.teacher');
    case 'TEACHER_ASSISTANT':
      return t('feedback.roles.assistant');
    case 'STUDENT':
      return t('feedback.roles.student');
    case 'PLATFORM_ADMIN':
    default:
      return t('feedback.roles.platformAdmin');
  }
};

const replyAuthorLabel = (reply: FeedbackReplyItem) => {
  const roleLabel = replyRoleLabel(reply.role);
  const author = reply.authorName || reply.accountEmail || '';
  return author ? `${author} · ${roleLabel}` : roleLabel;
};

const canSubmit = computed(
  () => form.message.trim().length > 0 && !state.submitting && !attachmentState.uploading
);
const isDirty = computed(
  () =>
    Boolean(form.subject.trim()) ||
    form.message.trim().length > 0 ||
    attachmentFiles.value.length > 0 ||
    attachmentState.result !== null
);

watch(
  () => form.message,
  (value) => {
    if (state.messageError && value.trim().length > 0) {
      state.messageError = '';
    }
  }
);

const resolveError = (error: unknown) => {
  if (isAxiosError(error)) {
    return (error.response?.data as { message?: string } | undefined)?.message || t('feedback.error');
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return t('feedback.error');
};

const resetAttachment = () => {
  attachmentFiles.value = [];
  attachmentState.result = null;
  attachmentState.error = '';
  attachmentState.uploading = false;
};

const clearForm = () => {
  form.subject = '';
  form.message = '';
  state.serverError = '';
  state.messageError = '';
  resetAttachment();
};

const resetReplyAttachment = (form: ReplyFormState) => {
  form.files = [];
  form.attachment.result = null;
  form.attachment.error = '';
  form.attachment.uploading = false;
};

const closeReplyForm = (id: number) => {
  const form = ensureReplyForm(id);
  form.open = false;
  form.message = '';
  form.error = '';
  resetReplyAttachment(form);
};

const loadHistory = async () => {
  history.loading = true;
  history.error = '';
  try {
    const items = await fetchUserFeedback();
    history.items = items;
    const validIds = new Set(items.map((item) => item.id));
    Object.keys(replyForms).forEach((key) => {
      const id = Number(key);
      if (!validIds.has(id)) {
        delete replyForms[id];
      }
    });
    items.forEach((item) => ensureReplyForm(item.id));
  } catch (error) {
    history.error = resolveError(error);
  } finally {
    history.loading = false;
  }
};

const toggleReplyForm = (id: number) => {
  const form = ensureReplyForm(id);
  if (form.open) {
    closeReplyForm(id);
  } else {
    form.open = true;
    form.error = '';
  }
};

const onAttachmentChange = async (files: File[]) => {
  const [file] = files;
  attachmentFiles.value = file ? [file] : [];
  attachmentState.error = '';
  attachmentState.result = null;
  if (!file) {
    return;
  }
  attachmentState.uploading = true;
  try {
    attachmentState.result = await uploadFeedbackAttachment(file);
  } catch (error) {
    attachmentState.error = resolveError(error);
    attachmentFiles.value = [];
  } finally {
    attachmentState.uploading = false;
  }
};

const onAttachmentRemove = () => {
  resetAttachment();
};

const onReplyAttachmentChange = async (id: number, files: File[]) => {
  const form = ensureReplyForm(id);
  const [file] = files;
  form.files = file ? [file] : [];
  form.attachment.error = '';
  form.attachment.result = null;
  if (!file) {
    return;
  }
  form.attachment.uploading = true;
  try {
    form.attachment.result = await uploadFeedbackAttachment(file);
  } catch (error) {
    form.attachment.error = resolveError(error);
    form.files = [];
  } finally {
    form.attachment.uploading = false;
  }
};

const onReplyAttachmentRemove = (id: number) => {
  const form = ensureReplyForm(id);
  resetReplyAttachment(form);
};

const handleSubmit = async () => {
  const sanitizedMessage = form.message.trim();
  if (!sanitizedMessage) {
    state.messageError = t('feedback.validation.messageRequired');
    return;
  }

  state.submitting = true;
  state.serverError = '';
  state.messageError = '';

  try {
    await submitFeedback({
      type: form.type,
      subject: form.subject.trim() || undefined,
      message: sanitizedMessage,
      attachmentUrl: attachmentState.result?.url,
      attachmentKey: attachmentState.result?.key
    });
    toast.success({ detail: t('feedback.success', { type: labelByType.value[form.type] }) });
    clearForm();
    await loadHistory();
  } catch (error) {
    state.serverError = resolveError(error);
  } finally {
    state.submitting = false;
  }
};

const submitReply = async (item: FeedbackResponse) => {
  const formState = ensureReplyForm(item.id);
  const sanitizedMessage = formState.message.trim();
  const attachmentUrl = formState.attachment.result?.url;
  const attachmentKey = formState.attachment.result?.key;

  if (!sanitizedMessage && !attachmentUrl) {
    formState.error = t('feedback.history.replyValidation');
    return;
  }

  formState.submitting = true;
  formState.error = '';

  try {
    const updated = await replyToUserFeedback(item.id, {
      message: sanitizedMessage || undefined,
      attachmentUrl: attachmentUrl || undefined,
      attachmentKey: attachmentKey || undefined
    });
    history.items = history.items.map((current) => (current.id === updated.id ? updated : current));
    toast.success({ detail: t('feedback.history.replySuccess') });
    closeReplyForm(item.id);
  } catch (error) {
    formState.error = resolveError(error);
  } finally {
    formState.submitting = false;
  }
};

onMounted(loadHistory);
</script>

<style scoped>
.user-feedback {
  display: flex;
  justify-content: center;
}

.user-feedback__card {
  width: min(720px, 100%);
}

.user-feedback__section {
  display: grid;
  gap: var(--sakai-space-3);
}

.user-feedback__label {
  font-weight: var(--sakai-font-weight-medium);
  color: var(--sakai-text-color-secondary);
}

.user-feedback__description {
  margin: 0;
  color: var(--sakai-text-color-tertiary);
  line-height: 1.6;
}

.user-feedback__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sakai-space-3);
  justify-content: flex-end;
}

.user-feedback__uploading,
.user-feedback__upload-ready {
  margin: 0;
  font-size: 0.875rem;
  color: var(--sakai-text-color-tertiary);
}

.user-feedback__upload-ready a {
  margin-left: var(--sakai-space-2);
  color: var(--sakai-primary);
  font-weight: var(--sakai-font-weight-medium);
  text-decoration: none;
}

.user-feedback__upload-ready a:hover {
  text-decoration: underline;
}

.user-feedback__history {
  margin-top: var(--sakai-space-6);
  gap: var(--sakai-space-4);
}

.user-feedback__history-title {
  margin: 0;
  font-size: 1rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.user-feedback__history-status {
  margin: 0;
  font-size: 0.875rem;
  color: var(--sakai-text-color-tertiary);
}

.user-feedback__history-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--sakai-space-4);
}

.user-feedback__history-item {
  border: 1px solid color-mix(in srgb, var(--sakai-primary) 16%, transparent);
  border-radius: var(--sakai-border-radius-lg);
  padding: var(--sakai-space-4);
  display: grid;
  gap: var(--sakai-space-3);
  background: color-mix(in srgb, var(--sakai-primary) 6%, transparent);
}

.user-feedback__history-meta {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-3);
}

.user-feedback__history-date {
  font-size: 0.875rem;
  color: var(--sakai-text-color-tertiary);
}

.user-feedback__history-subject {
  margin: 0;
  font-size: 1rem;
  font-weight: var(--sakai-font-weight-medium);
}

.user-feedback__history-message {
  margin: 0;
  white-space: pre-line;
}

.user-feedback__history-link {
  color: var(--sakai-primary);
  font-weight: var(--sakai-font-weight-medium);
  text-decoration: none;
}

.user-feedback__history-link:hover {
  text-decoration: underline;
}

.user-feedback__history-reply {
  border-radius: var(--sakai-border-radius-md);
  background: color-mix(in srgb, var(--sakai-primary) 12%, transparent);
  padding: var(--sakai-space-3);
  display: grid;
  gap: var(--sakai-space-2);
}

.user-feedback__history-thread {
  display: grid;
  gap: var(--sakai-space-3);
}

.user-feedback__history-actions {
  display: flex;
  justify-content: flex-end;
}

.user-feedback__history-reply-header {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-2);
  font-weight: var(--sakai-font-weight-medium);
  color: var(--sakai-text-color-secondary);
}

.user-feedback__history-reply-date {
  margin-left: auto;
  font-size: 0.75rem;
  color: var(--sakai-text-color-tertiary);
}

.user-feedback__history-reply-message {
  margin: 0;
  white-space: pre-line;
}

.user-feedback__history-reply-form {
  border: 1px solid color-mix(in srgb, var(--sakai-primary) 20%, transparent);
  border-radius: var(--sakai-border-radius-md);
  padding: var(--sakai-space-4);
  display: grid;
  gap: var(--sakai-space-3);
  background: color-mix(in srgb, var(--sakai-primary) 6%, transparent);
}

.user-feedback__history-uploading,
.user-feedback__history-upload-ready {
  margin: 0;
  font-size: 0.875rem;
  color: var(--sakai-text-color-tertiary);
}

.user-feedback__history-upload-ready a {
  margin-left: var(--sakai-space-2);
  color: var(--sakai-primary);
  text-decoration: none;
  font-weight: var(--sakai-font-weight-medium);
}

.user-feedback__history-upload-ready a:hover {
  text-decoration: underline;
}

.user-feedback__history-reply-actions {
  display: flex;
  gap: var(--sakai-space-3);
  justify-content: flex-end;
  flex-wrap: wrap;
}
</style>
