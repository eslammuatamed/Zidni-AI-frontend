<template>
  <ThemePage :title="t('live.chat.titlePage')" :subtitle="t('live.chat.subtitle')">
    <template #actions>
      <UiButton variant="outline" color="secondary" prepend-icon="ReloadOutlined" @click="loadSessions">
        {{ t('common.refresh') }}
      </UiButton>
    </template>

    <section class="chat-body">
      <UiCard class="chat-card" hover>
        <div class="chat-controls">
          <UiSelect v-model="selectedSessionIdString" :label="t('live.chat.selectSession')">
            <option value="">{{ t('live.chat.selectPlaceholder') }}</option>
            <option v-for="session in sessions" :key="session.sessionId" :value="String(session.sessionId)">
              {{ session.title }} — {{ session.courseTitle }}
            </option>
          </UiSelect>
        </div>

        <div v-if="!selectedSession" class="chat-empty">
          <UiAlert color="neutral" variant="soft">{{ t('live.chat.noSessionSelected') }}</UiAlert>
        </div>

        <div v-else class="chat-panel">
          <UiAlert
            v-if="selectedSession.registrationStatus === 'banned'"
            color="danger"
            variant="soft"
          >
            {{ t('live.chat.bannedNotice') }}
          </UiAlert>
          <UiAlert
            v-else-if="selectedSession.registrationStatus !== 'registered'"
            color="warning"
            variant="soft"
          >
            {{ t('live.chat.registrationRequired') }}
          </UiAlert>

          <div class="chat-feed" :aria-busy="chatLoading">
            <div v-if="chatError" class="chat-error">
              <UiAlert color="danger" variant="soft">{{ chatError }}</UiAlert>
            </div>
            <div v-else-if="!chatMessages.length && !chatLoading" class="chat-empty">
              <UiAlert color="neutral" variant="soft">{{ t('live.chat.noMessages') }}</UiAlert>
            </div>
            <ul v-else class="chat-feed__list">
              <li v-for="message in chatMessages" :key="message.id" class="chat-feed__item">
                <div class="chat-feed__meta">
                  <span class="chat-feed__author">
                    {{ message.senderType === 'teacher' ? message.teacherName || t('live.chat.teacherLabel') : message.studentName || t('live.chat.studentLabel') }}
                  </span>
                  <span class="chat-feed__time">{{ formatDateTime(message.sentAt) }}</span>
                </div>
                <p class="chat-feed__body">{{ message.message }}</p>
              </li>
            </ul>
          </div>

          <div class="chat-actions">
            <UiButton
              size="sm"
              variant="outline"
              color="secondary"
              :disabled="chatLoading"
              @click="refreshChat"
            >
              {{ t('live.chat.refresh') }}
            </UiButton>
          </div>

          <form class="chat-composer" @submit.prevent="sendMessage">
          <UiTextarea
            v-model="chatForm.message"
            :label="t('live.chat.messageLabel')"
            :rows="3"
            :disabled="!canSend || chatLoading"
          />
            <div class="chat-composer__actions">
              <UiButton type="submit" color="primary" :disabled="!canSend || chatLoading || !chatForm.message.trim()">
                {{ t('live.chat.sendMessage') }}
              </UiButton>
            </div>
          </form>
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
import UiAlert from '@/components/ui/UiAlert.vue';
import UiTextarea from '@/components/ui/UiTextarea.vue';
import { useToast } from '@/composables/useToast';
import { useRoute, useRouter } from 'vue-router';
import { listStudentSessions, type StudentLiveSession } from '@/api/live';
import { listChatMessages, sendChatMessage, type LiveChatMessage } from '@/api/liveChat';
import { formatDateTime } from '@/utils/formatters';

const { t } = useI18n();
const toast = useToast();
const route = useRoute();
const router = useRouter();

const sessions = ref<StudentLiveSession[]>([]);
const selectedSessionIdString = ref('');
const chatMessages = ref<LiveChatMessage[]>([]);
const chatLoading = ref(false);
const chatError = ref<string | null>(null);
const chatForm = reactive({ message: '' });
const pollHandle = ref<number | null>(null);

const selectedSessionId = computed(() => {
  if (!selectedSessionIdString.value) {
    return null;
  }
  return Number(selectedSessionIdString.value);
});

const selectedSession = computed(() => {
  if (!selectedSessionId.value) {
    return null;
  }
  return sessions.value.find((session) => session.sessionId === selectedSessionId.value) ?? null;
});

const canSend = computed(() => selectedSession.value?.registrationStatus === 'registered');

watch(selectedSessionId, async (next) => {
  if (!next) {
    chatMessages.value = [];
    return;
  }
  await refreshChat();
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
    await refreshChat();
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
  try {
    const data = await listStudentSessions({ page: 0, size: 100 });
    sessions.value = data.items;
    if (!selectedSessionId.value && data.items.length) {
      selectedSessionIdString.value = String(data.items[0].sessionId);
    }
  } catch (err: unknown) {
    toast.error(t('live.chat.loadError'));
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
    chatError.value = t('live.chat.chatLoadError');
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
    toast.success(t('live.chat.messageSent'));
  } catch (err: unknown) {
    toast.error(t('live.chat.messageError'));
  } finally {
    chatLoading.value = false;
  }
}
</script>

<style scoped>
.chat-body {
  margin-top: 16px;
}

.chat-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chat-controls {
  display: flex;
  gap: 16px;
}

.chat-empty {
  display: flex;
  justify-content: center;
}

.chat-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chat-feed {
  max-height: 420px;
  overflow-y: auto;
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 60%, transparent);
  border-radius: var(--sakai-border-radius-md);
  padding: 16px;
  background: color-mix(in srgb, var(--sakai-primary) 3%, transparent);
}

.chat-error {
  display: flex;
}

.chat-feed__list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0;
}

.chat-feed__item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: color-mix(in srgb, var(--sakai-surface) 90%, transparent);
  border-radius: var(--sakai-border-radius-md);
  padding: 12px;
}

.chat-feed__meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--sakai-text-color-tertiary);
}

.chat-feed__author {
  font-weight: 600;
}

.chat-feed__body {
  margin: 0;
  white-space: pre-wrap;
}

.chat-actions {
  display: flex;
  justify-content: flex-end;
}

.chat-composer {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-composer__actions {
  display: flex;
  justify-content: flex-end;
}
</style>
