<template>
  <ThemePage :title="t('feedback.admin.title')" :subtitle="t('feedback.admin.subtitle')">
    <section class="feedback-inbox">
      <UiCard class="feedback-inbox__card">
        <template #title>{{ t('feedback.admin.tableTitle') }}</template>
        <template #subtitle>{{ t('feedback.admin.tableSubtitle') }}</template>
        <template #actions>
          <div class="feedback-inbox__actions">
            <span class="feedback-inbox__timestamp" v-if="lastUpdatedLabel">{{ lastUpdatedLabel }}</span>
            <UiButton
              variant="outline"
              color="secondary"
              prepend-icon="ReloadOutlined"
              :disabled="state.loading"
              @click="loadFeedback"
            >
              {{ t('feedback.admin.refresh') }}
            </UiButton>
          </div>
        </template>

        <UiAlert v-if="state.error" color="danger" variant="soft" class="feedback-inbox__alert">
          {{ state.error }}
        </UiAlert>

        <div v-if="state.loading" class="feedback-inbox__status">
          {{ t('feedback.admin.loading') }}
        </div>

        <div v-else-if="state.feedback.length" class="feedback-inbox__table-wrapper">
          <table class="feedback-inbox__table">
            <thead>
              <tr>
                <th scope="col">{{ t('feedback.admin.columns.type') }}</th>
                <th scope="col">{{ t('feedback.admin.columns.role') }}</th>
                <th scope="col">{{ t('feedback.admin.columns.sender') }}</th>
                <th scope="col">{{ t('feedback.admin.columns.email') }}</th>
                <th scope="col">{{ t('feedback.admin.columns.teacher') }}</th>
                <th scope="col">{{ t('feedback.admin.columns.subject') }}</th>
                <th scope="col">{{ t('feedback.admin.columns.message') }}</th>
                <th scope="col">{{ t('feedback.admin.columns.attachment') }}</th>
                <th scope="col">{{ t('feedback.admin.columns.replyStatus') }}</th>
                <th scope="col">{{ t('feedback.admin.columns.createdAt') }}</th>
                <th scope="col">{{ t('feedback.admin.columns.repliedAt') }}</th>
                <th scope="col">{{ t('feedback.admin.columns.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in state.feedback" :key="item.id">
                <td :data-label="t('feedback.admin.columns.type')">
                  <UiTag :color="item.type === 'COMPLAINT' ? 'danger' : 'success'" size="sm">
                    {{ typeLabel(item.type) }}
                  </UiTag>
                </td>
                <td :data-label="t('feedback.admin.columns.role')">
                  <UiTag color="primary" variant="soft" size="sm">{{ roleLabel(item.role) }}</UiTag>
                </td>
                <td :data-label="t('feedback.admin.columns.sender')">
                  {{ senderName(item) }}
                </td>
                <td :data-label="t('feedback.admin.columns.email')">
                  <a class="feedback-inbox__link" :href="`mailto:${item.accountEmail}`">{{ item.accountEmail }}</a>
                </td>
                <td :data-label="t('feedback.admin.columns.teacher')">
                  <span v-if="item.teacherName">{{ item.teacherName }}</span>
                  <span v-else class="feedback-inbox__muted">{{ t('feedback.admin.unassignedTeacher') }}</span>
                </td>
                <td :data-label="t('feedback.admin.columns.subject')">
                  <span v-if="item.subject">{{ item.subject }}</span>
                  <span v-else class="feedback-inbox__muted">{{ t('feedback.admin.noSubject') }}</span>
                </td>
                <td :data-label="t('feedback.admin.columns.message')">
                  <p class="feedback-inbox__message">{{ item.message }}</p>
                </td>
                <td :data-label="t('feedback.admin.columns.attachment')">
                  <a
                    v-if="item.attachmentUrl"
                    :href="item.attachmentUrl"
                    target="_blank"
                    rel="noopener"
                    class="feedback-inbox__link"
                  >
                    {{ t('feedback.admin.viewAttachment') }}
                  </a>
                  <span v-else class="feedback-inbox__muted">{{ t('feedback.admin.noAttachment') }}</span>
                </td>
                <td :data-label="t('feedback.admin.columns.replyStatus')">
                  <UiTag :color="hasAdminReply(item) ? 'success' : 'warning'" size="sm">
                    {{ hasAdminReply(item) ? t('feedback.admin.replySent') : t('feedback.admin.replyPending') }}
                  </UiTag>
                </td>
                <td :data-label="t('feedback.admin.columns.createdAt')">
                  {{ formatDateTime(item.createdAt) }}
                </td>
                <td :data-label="t('feedback.admin.columns.repliedAt')">
                  <span v-if="item.repliedAt">{{ formatDateTime(item.repliedAt) }}</span>
                  <span v-else class="feedback-inbox__muted">{{ t('feedback.admin.notReplied') }}</span>
                </td>
                <td :data-label="t('feedback.admin.columns.actions')">
                  <div class="feedback-inbox__actions-cell">
                    <UiButton size="sm" variant="ghost" color="secondary" @click="openDetail(item, { viewOnly: true })">
                      {{ t('feedback.admin.viewAction') }}
                    </UiButton>
                    <UiButton size="sm" variant="outline" color="primary" @click="openDetail(item)">
                      {{ t('feedback.admin.replyAction') }}
                    </UiButton>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="feedback-inbox__status">
          {{ t('feedback.admin.empty') }}
        </div>
      </UiCard>
    </section>

    <UiDialog v-model="detailDialog.open" :title="detailDialogTitle" width="720px" @hide="closeDetail">
      <template v-if="detailDialog.feedback">
        <div class="feedback-inbox__detail">
          <section class="feedback-inbox__detail-section">
            <h4>{{ t('feedback.admin.detail.requestHeading') }}</h4>
            <ul class="feedback-inbox__detail-meta">
              <li>
                <strong>{{ t('feedback.admin.columns.type') }}:</strong>
                <span>{{ typeLabel(detailDialog.feedback.type) }}</span>
              </li>
              <li>
                <strong>{{ t('feedback.admin.columns.createdAt') }}:</strong>
                <span>{{ formatDateTime(detailDialog.feedback.createdAt) }}</span>
              </li>
              <li>
                <strong>{{ t('feedback.admin.columns.sender') }}:</strong>
                <span>{{ senderName(detailDialog.feedback) }}</span>
              </li>
            </ul>
            <p class="feedback-inbox__detail-message">{{ detailDialog.feedback.message }}</p>
            <a
              v-if="detailDialog.feedback.attachmentUrl"
              :href="detailDialog.feedback.attachmentUrl"
              target="_blank"
              rel="noopener"
              class="feedback-inbox__link"
            >
              {{ t('feedback.admin.viewAttachment') }}
            </a>
          </section>

          <section class="feedback-inbox__detail-section">
            <h4>{{ t('feedback.admin.detail.conversationHeading') }}</h4>
            <p v-if="!detailDialog.feedback.replies.length" class="feedback-inbox__detail-thread-empty">
              {{ t('feedback.admin.detail.noReplies') }}
            </p>
            <ul v-else class="feedback-inbox__detail-thread">
              <li
                v-for="(reply, index) in detailDialog.feedback.replies"
                :key="replyKey(detailDialog.feedback, reply, index)"
                class="feedback-inbox__detail-thread-item"
              >
                <div class="feedback-inbox__detail-reply-header">
                  <span class="feedback-inbox__detail-reply-author">{{ replyAuthorLabel(reply) }}</span>
                  <span v-if="reply.createdAt" class="feedback-inbox__detail-reply-date">
                    {{ formatDateTime(reply.createdAt) }}
                  </span>
                </div>
                <p v-if="reply.message" class="feedback-inbox__detail-message">{{ reply.message }}</p>
                <a
                  v-if="reply.attachmentUrl"
                  :href="reply.attachmentUrl"
                  target="_blank"
                  rel="noopener"
                  class="feedback-inbox__link"
                >
                  {{ t('feedback.admin.detail.viewReplyAttachment') }}
                </a>
              </li>
            </ul>
          </section>

          <section v-if="!detailDialog.viewOnly" class="feedback-inbox__detail-section">
            <h4>{{ t('feedback.admin.detail.replyFormHeading') }}</h4>
            <UiTextarea
              v-model="detailDialog.replyMessage"
              :label="t('feedback.admin.detail.replyLabel')"
              :placeholder="t('feedback.admin.detail.replyPlaceholder')"
              :rows="6"
              maxlength="4000"
            />
            <UiFileUpload
              v-model="replyAttachmentFiles"
              :accept="attachmentAccept"
              :disabled="detailDialog.attachment.uploading || detailDialog.submitting"
              :label="t('feedback.admin.detail.attachmentDropLabel')"
              :hint="t('feedback.admin.detail.attachmentHint')"
              @change="onReplyAttachmentChange"
              @remove="onReplyAttachmentRemove"
            />
            <UiAlert v-if="detailDialog.attachment.error" color="danger" variant="soft">
              {{ detailDialog.attachment.error }}
            </UiAlert>
            <p v-else-if="detailDialog.attachment.uploading" class="feedback-inbox__detail-uploading">
              {{ t('feedback.admin.detail.attachmentUploading') }}
            </p>
            <p v-else-if="detailDialog.attachment.result" class="feedback-inbox__detail-upload-ready">
              {{ t('feedback.admin.detail.attachmentReady') }}
              <a :href="detailDialog.attachment.result.url" target="_blank" rel="noopener">{{ t('feedback.admin.detail.previewAttachment') }}</a>
            </p>
            <UiAlert v-if="detailDialog.serverError" color="danger" variant="soft">
              {{ detailDialog.serverError }}
            </UiAlert>
            <div class="feedback-inbox__detail-actions">
              <UiButton
                color="primary"
                :disabled="detailDialog.submitting || detailDialog.attachment.uploading"
                @click="submitReply"
              >
                {{ detailDialog.submitting ? t('feedback.admin.detail.sending') : detailDialogButtonLabel }}
              </UiButton>
              <UiButton variant="ghost" color="secondary" :disabled="detailDialog.submitting" @click="closeDetail">
                {{ t('feedback.admin.detail.close') }}
              </UiButton>
            </div>
          </section>
        </div>
      </template>
    </UiDialog>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { isAxiosError } from 'axios';
import ThemePage from '@/layout/theme/ThemePage.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiTag from '@/components/ui/UiTag.vue';
import UiDialog from '@/components/ui/UiDialog.vue';
import UiTextarea from '@/components/ui/UiTextarea.vue';
import UiFileUpload from '@/components/ui/UiFileUpload.vue';
import { useToast } from '@/composables/useToast';
import {
  fetchAdminFeedback,
  replyToFeedback,
  uploadAdminFeedbackAttachment,
  type AdminFeedbackItem,
  type FeedbackAttachmentUploadResult,
  type FeedbackType,
  type FeedbackReplyItem
} from '@/services/feedback';
import { formatDateTime } from '@/utils/formatters';

const { t } = useI18n();
const toast = useToast();

const attachmentAccept = '.pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt';

interface FeedbackInboxState {
  loading: boolean;
  error: string;
  feedback: AdminFeedbackItem[];
  lastLoadedAt: string;
}

const state = reactive<FeedbackInboxState>({
  loading: false,
  error: '',
  feedback: [],
  lastLoadedAt: ''
});

const detailDialog = reactive({
  open: false,
  feedback: null as AdminFeedbackItem | null,
  replyMessage: '',
  serverError: '',
  submitting: false,
  attachment: {
    uploading: false,
    error: '',
    result: null as FeedbackAttachmentUploadResult | null
  },
  viewOnly: false
});

const replyAttachmentFiles = ref<File[]>([]);

const lastUpdatedLabel = computed(() =>
  state.lastLoadedAt
    ? t('feedback.admin.lastRefreshed', { value: formatDateTime(state.lastLoadedAt) })
    : ''
);

const detailDialogTitle = computed(() =>
  detailDialog.feedback
    ? t('feedback.admin.detail.title', {
        sender: senderName(detailDialog.feedback)
      })
    : t('feedback.admin.detail.title', { sender: '' })
);

const detailDialogButtonLabel = computed(() => t('feedback.admin.detail.submitButton'));

const resolveError = (error: unknown) => {
  if (isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)?.message;
    return message && message.trim().length > 0 ? message : t('feedback.admin.error');
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return t('feedback.admin.error');
};

const typeLabel = (type: FeedbackType) =>
  type === 'COMPLAINT' ? t('feedback.types.complaint') : t('feedback.types.suggestion');

const roleLabel = (role: AdminFeedbackItem['role']) => {
  switch (role) {
    case 'TEACHER':
      return t('feedback.roles.teacher');
    case 'TEACHER_ASSISTANT':
      return t('feedback.roles.assistant');
    case 'STUDENT':
    default:
      return t('feedback.roles.student');
  }
};

const senderName = (item: AdminFeedbackItem) =>
  item.actorName || item.accountEmail || t('feedback.admin.unknownSender');

const hasAdminReply = (item: AdminFeedbackItem) =>
  Boolean(item.replies?.some((reply) => reply.role === 'PLATFORM_ADMIN'));

const replyRoleLabel = (role: FeedbackReplyItem['role']) => {
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
  const role = replyRoleLabel(reply.role);
  const author = reply.authorName || reply.accountEmail || '';
  return author ? `${author} · ${role}` : role;
};

const replyKey = (item: AdminFeedbackItem, reply: FeedbackReplyItem, index: number) =>
  `${item.id}-${reply.id ?? reply.createdAt ?? index}`;

const loadFeedback = async () => {
  state.loading = true;
  state.error = '';

  try {
    state.feedback = await fetchAdminFeedback();
    state.lastLoadedAt = new Date().toISOString();
    if (detailDialog.feedback) {
      const updated = state.feedback.find((item) => item.id === detailDialog.feedback?.id);
      if (updated) {
        detailDialog.feedback = updated;
      }
    }
  } catch (error) {
    state.error = resolveError(error);
  } finally {
    state.loading = false;
  }
};

const resetDetailAttachment = () => {
  detailDialog.attachment.error = '';
  detailDialog.attachment.result = null;
  detailDialog.attachment.uploading = false;
  replyAttachmentFiles.value = [];
};

const openDetail = (item: AdminFeedbackItem, options: { viewOnly?: boolean } = {}) => {
  detailDialog.open = true;
  detailDialog.feedback = item;
  detailDialog.replyMessage = '';
  detailDialog.serverError = '';
  detailDialog.submitting = false;
  detailDialog.viewOnly = Boolean(options.viewOnly);
  resetDetailAttachment();
};

const closeDetail = () => {
  detailDialog.open = false;
  detailDialog.feedback = null;
  detailDialog.replyMessage = '';
  detailDialog.serverError = '';
  detailDialog.viewOnly = false;
  resetDetailAttachment();
};

const onReplyAttachmentChange = async (files: File[]) => {
  if (!detailDialog.feedback) {
    return;
  }
  const [file] = files;
  replyAttachmentFiles.value = file ? [file] : [];
  detailDialog.attachment.error = '';
  detailDialog.attachment.result = null;
  if (!file) {
    return;
  }
  detailDialog.attachment.uploading = true;
  try {
    detailDialog.attachment.result = await uploadAdminFeedbackAttachment(detailDialog.feedback.id, file);
  } catch (error) {
    detailDialog.attachment.error = resolveError(error);
    replyAttachmentFiles.value = [];
  } finally {
    detailDialog.attachment.uploading = false;
  }
};

const onReplyAttachmentRemove = () => {
  detailDialog.attachment.result = null;
  detailDialog.attachment.error = '';
  replyAttachmentFiles.value = [];
};

const submitReply = async () => {
  if (!detailDialog.feedback) {
    return;
  }
  const sanitizedMessage = detailDialog.replyMessage.trim();
  const hasMessage = sanitizedMessage.length > 0;
  const hasAttachment = Boolean(detailDialog.attachment.result);
  if (!hasMessage && !hasAttachment) {
    detailDialog.serverError = t('feedback.admin.detail.validation');
    return;
  }

  detailDialog.submitting = true;
  detailDialog.serverError = '';

  const attachmentUrl = detailDialog.attachment.result?.url;
  const attachmentKey = detailDialog.attachment.result?.key;

  try {
    const updated = await replyToFeedback(detailDialog.feedback.id, {
      message: hasMessage ? sanitizedMessage : undefined,
      attachmentUrl: attachmentUrl || undefined,
      attachmentKey: attachmentKey || undefined
    });
    state.feedback = state.feedback.map((item) => (item.id === updated.id ? updated : item));
    detailDialog.feedback = updated;
    detailDialog.replyMessage = '';
    resetDetailAttachment();
    toast.success({ detail: t('feedback.admin.detail.success') });
  } catch (error) {
    detailDialog.serverError = resolveError(error);
  } finally {
    detailDialog.submitting = false;
  }
};

onMounted(loadFeedback);
</script>

<style scoped>
.feedback-inbox {
  display: flex;
  justify-content: center;
}

.feedback-inbox__card {
  width: min(1100px, 100%);
}

.feedback-inbox__actions {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-4);
}

.feedback-inbox__actions-cell {
  display: flex;
  gap: var(--sakai-space-2);
  flex-wrap: wrap;
}

.feedback-inbox__timestamp {
  color: var(--sakai-text-color-tertiary);
  font-size: 0.875rem;
}

.feedback-inbox__alert {
  margin-bottom: var(--sakai-space-4);
}

.feedback-inbox__status {
  padding: var(--sakai-space-6) 0;
  text-align: center;
  color: var(--sakai-text-color-tertiary);
}

.feedback-inbox__table-wrapper {
  overflow-x: auto;
}

.feedback-inbox__table {
  width: 100%;
  border-collapse: collapse;
  min-width: 960px;
}

.feedback-inbox__table th,
.feedback-inbox__table td {
  padding: var(--sakai-space-3);
  text-align: left;
  border-bottom: 1px solid color-mix(in srgb, var(--sakai-primary) 14%, transparent);
}

.feedback-inbox__table th {
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color-secondary);
}

.feedback-inbox__message {
  margin: 0;
  white-space: pre-line;
}

.feedback-inbox__muted {
  color: var(--sakai-text-color-tertiary);
}

.feedback-inbox__link {
  color: var(--sakai-primary);
  text-decoration: none;
  font-weight: var(--sakai-font-weight-medium);
}

.feedback-inbox__link:hover {
  text-decoration: underline;
}

.feedback-inbox__detail {
  display: grid;
  gap: var(--sakai-space-5);
}

.feedback-inbox__detail-section {
  display: grid;
  gap: var(--sakai-space-3);
}

.feedback-inbox__detail-section h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.feedback-inbox__detail-meta {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--sakai-space-2);
  font-size: 0.9rem;
  color: var(--sakai-text-color-secondary);
}

.feedback-inbox__detail-meta-note {
  margin: 0;
  font-size: 0.85rem;
  color: var(--sakai-text-color-tertiary);
}

.feedback-inbox__detail-message {
  margin: 0;
  white-space: pre-line;
}

.feedback-inbox__detail-thread {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--sakai-space-3);
}

.feedback-inbox__detail-thread-item {
  border: 1px solid color-mix(in srgb, var(--sakai-primary) 18%, transparent);
  border-radius: var(--sakai-border-radius-md);
  padding: var(--sakai-space-3);
  background: color-mix(in srgb, var(--sakai-primary) 8%, transparent);
  display: grid;
  gap: var(--sakai-space-2);
}

.feedback-inbox__detail-thread-empty {
  margin: 0;
  font-size: 0.9rem;
  color: var(--sakai-text-color-tertiary);
}

.feedback-inbox__detail-reply-header {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-2);
  font-weight: var(--sakai-font-weight-medium);
  color: var(--sakai-text-color-secondary);
}

.feedback-inbox__detail-reply-author {
  flex: 1;
}

.feedback-inbox__detail-reply-date {
  font-size: 0.8rem;
  color: var(--sakai-text-color-tertiary);
}

.feedback-inbox__detail-uploading,
.feedback-inbox__detail-upload-ready {
  margin: 0;
  font-size: 0.875rem;
  color: var(--sakai-text-color-tertiary);
}

.feedback-inbox__detail-upload-ready a {
  margin-left: var(--sakai-space-2);
  color: var(--sakai-primary);
  text-decoration: none;
  font-weight: var(--sakai-font-weight-medium);
}

.feedback-inbox__detail-upload-ready a:hover {
  text-decoration: underline;
}

.feedback-inbox__detail-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--sakai-space-3);
}

@media (max-width: 900px) {
  .feedback-inbox__table {
    min-width: 100%;
  }

  .feedback-inbox__table thead {
    display: none;
  }

  .feedback-inbox__table tr {
    display: grid;
    gap: var(--sakai-space-3);
    padding: var(--sakai-space-3);
    border-bottom: 1px solid color-mix(in srgb, var(--sakai-primary) 14%, transparent);
  }

  .feedback-inbox__table td {
    border: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--sakai-space-1);
  }

  .feedback-inbox__table td::before {
    content: attr(data-label);
    font-weight: var(--sakai-font-weight-medium);
    color: var(--sakai-text-color-secondary);
  }
}
</style>
