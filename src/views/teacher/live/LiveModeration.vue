<template>
  <ThemePage :title="t('live.moderation.titlePage')" :subtitle="t('live.moderation.subtitle')">
    <template #actions>
      <div class="moderation-actions">
        <UiButton
          variant="outline"
          color="secondary"
          prepend-icon="ReloadOutlined"
          :disabled="sessionsLoading"
          @click="loadSessions"
        >
          {{ t('common.refresh') }}
        </UiButton>
      </div>
    </template>

    <section class="moderation-body">
      <UiCard class="moderation-card" hover>
        <div class="moderation-controls">
          <UiSelect v-model="selectedSessionIdString" :label="t('live.moderation.selectSession')">
            <option value="">{{ t('live.moderation.selectPlaceholder') }}</option>
            <option v-for="session in sessions" :key="session.id" :value="String(session.id)">
              {{ session.title }} — {{ session.courseTitle }}
            </option>
          </UiSelect>
        </div>

        <UiTabs v-model="activeTab" :tabs="tabItems" />

        <div v-if="!selectedSessionId" class="moderation-empty">
          <UiAlert color="neutral" variant="soft">{{ t('live.moderation.noSessionSelected') }}</UiAlert>
        </div>

        <div v-else>
          <div v-if="activeTab === 'chat'" class="moderation-chat">
            <div class="moderation-chat__header">
              <UiButton
                size="sm"
                variant="outline"
                color="secondary"
                :disabled="chatLoading"
                @click="refreshChat"
              >
                {{ t('live.moderation.refreshChat') }}
              </UiButton>
            </div>
            <div class="moderation-chat__feed" :aria-busy="chatLoading">
              <div v-if="chatError" class="moderation-error">
                <UiAlert color="danger" variant="soft">{{ chatError }}</UiAlert>
              </div>
              <div v-else-if="!chatMessages.length && !chatLoading" class="moderation-empty">
                <UiAlert color="neutral" variant="soft">{{ t('live.moderation.noMessages') }}</UiAlert>
              </div>
              <ul v-else class="moderation-chat__messages">
                <li v-for="message in chatMessages" :key="message.id" class="moderation-chat__message">
                  <div class="moderation-chat__meta">
                    <span class="moderation-chat__author">
                      {{ message.senderType === 'teacher' ? message.teacherName || t('live.moderation.teacherLabel') : message.studentName || t('live.moderation.studentLabel') }}
                    </span>
                    <span class="moderation-chat__time">{{ formatDateTime(message.sentAt) }}</span>
                  </div>
                  <p class="moderation-chat__body">{{ message.message }}</p>
                </li>
              </ul>
            </div>
            <form class="moderation-chat__composer" @submit.prevent="sendMessage">
              <UiTextarea
                v-model="chatForm.message"
                :label="t('live.moderation.messageLabel')"
                :rows="3"
                :disabled="chatLoading"
              />
              <div class="moderation-chat__composer-actions">
                <UiButton type="submit" color="primary" :disabled="chatLoading || !chatForm.message.trim()">
                  {{ t('live.moderation.sendMessage') }}
                </UiButton>
              </div>
            </form>
          </div>

          <div v-else class="moderation-bans">
            <div class="moderation-bans__form">
              <UiSelect v-model="banForm.studentId" :label="t('live.moderation.banStudentLabel')">
                <option value="">{{ t('live.moderation.banStudentPlaceholder') }}</option>
                <option
                  v-for="registration in registrants"
                  :key="registration.studentId"
                  :value="String(registration.studentId)"
                  :disabled="registration.status === 'banned'"
                >
                  {{ registration.studentName }} — {{ registration.studentEmail }}
                </option>
              </UiSelect>
              <UiTextarea
                v-model="banForm.reason"
                :label="t('live.moderation.banReason')"
                :rows="2"
                maxlength="200"
              />
              <UiButton
                color="danger"
                :disabled="banLoading || !banForm.studentId"
                @click="submitBan"
              >
                {{ t('live.moderation.applyBan') }}
              </UiButton>
            </div>
            <div class="moderation-bans__list" :aria-busy="banLoading">
              <div v-if="banError" class="moderation-error">
                <UiAlert color="danger" variant="soft">{{ banError }}</UiAlert>
              </div>
              <div v-else-if="!bans.length && !banLoading" class="moderation-empty">
                <UiAlert color="neutral" variant="soft">{{ t('live.moderation.noBans') }}</UiAlert>
              </div>
              <UiTable v-else :items="bans" :headers="banHeaders" density="comfortable">
                <template #item.createdAt="{ item }">
                  {{ formatDateTime(item.createdAt) }}
                </template>
                <template #item.actions="{ item }">
                  <UiButton size="sm" variant="link" color="secondary" @click="removeBan(item)">
                    {{ t('live.moderation.removeBan') }}
                  </UiButton>
                </template>
              </UiTable>
            </div>
          </div>
        </div>
      </UiCard>
    </section>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ThemePage from '@/layout/theme/ThemePage.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiTabs from '@/components/ui/UiTabs.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiTable, { type UiTableHeader } from '@/components/ui/UiTable.vue';
import UiTextarea from '@/components/ui/UiTextarea.vue';
import { useToast } from '@/composables/useToast';
import { useRoute, useRouter } from 'vue-router';
import {
  listTeacherSessions,
  listTeacherRegistrations,
  type TeacherLiveSession,
  type LiveSessionRegistration
} from '@/api/live';
import {
  banStudent,
  listChatMessages,
  listSessionBans,
  sendChatMessage,
  unbanStudent,
  type LiveChatMessage,
  type LiveSessionBan
} from '@/api/liveChat';
import { formatDateTime } from '@/utils/formatters';

const { t } = useI18n();
const toast = useToast();
const route = useRoute();
const router = useRouter();

const sessions = ref<TeacherLiveSession[]>([]);
const sessionsLoading = ref(false);
const selectedSessionIdString = ref('');
const activeTab = ref<'chat' | 'bans'>('chat');

const chatMessages = ref<LiveChatMessage[]>([]);
const chatLoading = ref(false);
const chatError = ref<string | null>(null);

const chatForm = reactive({ message: '' });

const bans = ref<LiveSessionBan[]>([]);
const banLoading = ref(false);
const banError = ref<string | null>(null);

const registrants = ref<LiveSessionRegistration[]>([]);

const banForm = reactive({ studentId: '', reason: '' });

const pollHandle = ref<number | null>(null);

const selectedSessionId = computed(() => {
  if (!selectedSessionIdString.value) {
    return null;
  }
  return Number(selectedSessionIdString.value);
});

const tabItems = computed(() => [
  { label: t('live.moderation.chatTab'), value: 'chat' },
  { label: t('live.moderation.bansTab'), value: 'bans' }
]);

const banHeaders = computed<UiTableHeader[]>(() => [
  { key: 'studentName', label: t('live.moderation.studentColumn') },
  { key: 'studentEmail', label: t('live.moderation.emailColumn') },
  { key: 'reason', label: t('live.moderation.reasonColumn') },
  { key: 'createdAt', label: t('live.moderation.createdAtColumn') },
  { key: 'actions', label: t('common.actions'), sortable: false }
]);

watch(selectedSessionId, async (next) => {
  if (!next) {
    chatMessages.value = [];
    bans.value = [];
    registrants.value = [];
    return;
  }
  await Promise.all([refreshChat(), refreshBans(), refreshRegistrants()]);
});

watch(selectedSessionIdString, (value) => {
  const query = { ...route.query } as Record<string, string | undefined>;
  if (value) {
    query.sessionId = value;
  } else {
    delete query.sessionId;
  }
  router.replace({ query }).catch(() => {
    /* ignore */
  });
});

onMounted(async () => {
  const initialSessionId = route.query.sessionId;
  if (typeof initialSessionId === 'string' && initialSessionId) {
    selectedSessionIdString.value = initialSessionId;
  }
  await loadSessions();
  if (selectedSessionId.value) {
    await Promise.all([refreshChat(), refreshBans(), refreshRegistrants()]);
  }
  pollHandle.value = window.setInterval(() => {
    if (selectedSessionId.value) {
      refreshChat(false);
    }
  }, 10000);
});

onBeforeUnmount(() => {
  if (pollHandle.value) {
    window.clearInterval(pollHandle.value);
  }
});

async function loadSessions() {
  sessionsLoading.value = true;
  try {
    const data = await listTeacherSessions({ page: 0, size: 100 });
    sessions.value = data.items;
    if (!selectedSessionId.value && data.items.length) {
      selectedSessionIdString.value = String(data.items[0].id);
    }
  } catch (err: unknown) {
    toast.error(t('live.moderation.loadSessionsError'));
  } finally {
    sessionsLoading.value = false;
  }
}

async function refreshChat(reset = true) {
  if (!selectedSessionId.value) {
    return;
  }
  chatLoading.value = true;
  chatError.value = null;
  try {
    const data = await listChatMessages(selectedSessionId.value, { limit: 200 });
    chatMessages.value = data.items;
    if (reset) {
      chatForm.message = '';
    }
  } catch (err: unknown) {
    chatError.value = t('live.moderation.chatLoadError');
  } finally {
    chatLoading.value = false;
  }
}

async function sendMessage() {
  if (!selectedSessionId.value || !chatForm.message.trim()) {
    return;
  }
  chatLoading.value = true;
  try {
    await sendChatMessage(selectedSessionId.value, { message: chatForm.message });
    chatForm.message = '';
    await refreshChat(false);
    toast.success(t('live.moderation.messageSent'));
  } catch (err: unknown) {
    toast.error(t('live.moderation.messageError'));
  } finally {
    chatLoading.value = false;
  }
}

async function refreshBans() {
  if (!selectedSessionId.value) {
    return;
  }
  banLoading.value = true;
  banError.value = null;
  try {
    bans.value = await listSessionBans(selectedSessionId.value);
  } catch (err: unknown) {
    banError.value = t('live.moderation.bansLoadError');
  } finally {
    banLoading.value = false;
  }
}

async function refreshRegistrants() {
  if (!selectedSessionId.value) {
    registrants.value = [];
    return;
  }
  try {
    registrants.value = await listTeacherRegistrations(selectedSessionId.value);
  } catch (err: unknown) {
    registrants.value = [];
  }
}

async function submitBan() {
  if (!selectedSessionId.value || !banForm.studentId) {
    return;
  }
  banLoading.value = true;
  try {
    await banStudent(selectedSessionId.value, {
      studentId: Number(banForm.studentId),
      reason: banForm.reason?.trim() || undefined
    });
    toast.success(t('live.moderation.banApplied'));
    banForm.studentId = '';
    banForm.reason = '';
    await Promise.all([refreshBans(), refreshRegistrants()]);
  } catch (err: unknown) {
    toast.error(t('live.moderation.banError'));
  } finally {
    banLoading.value = false;
  }
}

async function removeBan(item: LiveSessionBan) {
  if (!selectedSessionId.value) {
    return;
  }
  banLoading.value = true;
  try {
    await unbanStudent(selectedSessionId.value, item.studentId);
    toast.success(t('live.moderation.banRemoved'));
    await Promise.all([refreshBans(), refreshRegistrants()]);
  } catch (err: unknown) {
    toast.error(t('live.moderation.unbanError'));
  } finally {
    banLoading.value = false;
  }
}
</script>

<style scoped>
.moderation-actions {
  display: flex;
  gap: 12px;
}

.moderation-body {
  margin-top: 16px;
}

.moderation-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.moderation-controls {
  display: flex;
  gap: 16px;
}

.moderation-empty {
  display: flex;
  justify-content: center;
}

.moderation-chat {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.moderation-chat__header {
  display: flex;
  justify-content: flex-end;
}

.moderation-chat__feed {
  max-height: 420px;
  overflow-y: auto;
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 60%, transparent);
  border-radius: var(--sakai-border-radius-md);
  padding: 16px;
  background: color-mix(in srgb, var(--sakai-primary) 3%, transparent);
}

.moderation-chat__messages {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0;
}

.moderation-chat__message {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: color-mix(in srgb, var(--sakai-surface) 90%, transparent);
  border-radius: var(--sakai-border-radius-md);
  padding: 12px;
}

.moderation-chat__meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--sakai-text-color-tertiary);
}

.moderation-chat__author {
  font-weight: 600;
}

.moderation-chat__body {
  margin: 0;
  white-space: pre-wrap;
}

.moderation-chat__composer {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.moderation-chat__composer-actions {
  display: flex;
  justify-content: flex-end;
}

.moderation-bans {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.moderation-bans__form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
  align-items: end;
}

.moderation-bans__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.moderation-error {
  display: flex;
}
</style>
