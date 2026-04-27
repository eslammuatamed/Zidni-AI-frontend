<template>
  <UiCard class="discussions-thread-view" :title="thread?.title ?? t('discussions.view.placeholderTitle')">
    <UiAlert v-if="!thread" color="info" class="discussions-thread-view__empty">
      {{ t('discussions.view.selectThread') }}
    </UiAlert>

    <template v-else>
      <div class="discussions-thread-view__meta">
        <span>{{ thread.createdByName }}</span>
        <span>•</span>
        <span>{{ formatDate(thread.createdAt) }}</span>
      </div>

      <UiAlert v-if="errorMessage" color="danger" class="discussions-thread-view__error">
        {{ errorMessage }}
      </UiAlert>

      <div class="discussions-thread-view__messages" :class="{ 'is-loading': loading }">
        <UiButton
          v-if="hasMore"
          class="discussions-thread-view__load-more"
          variant="link"
          :disabled="loading"
          @click="loadMore"
        >
          {{ t('discussions.actions.loadMore') }}
        </UiButton>
        <article v-for="message in messages" :key="message.id" class="discussions-thread-view__message">
          <header class="discussions-thread-view__message-header">
            <strong>{{ message.authorName }}</strong>
            <span>{{ formatDate(message.createdAt) }}</span>
          </header>
          <p class="discussions-thread-view__message-body">{{ message.body }}</p>
        </article>
        <UiAlert v-if="!messages.length && !loading" color="info" class="discussions-thread-view__empty">
          {{ t('discussions.view.noMessages') }}
        </UiAlert>
      </div>

      <form class="discussions-thread-view__composer" @submit.prevent="submitMessage">
        <UiInput
          v-model="composer"
          :label="t('discussions.view.composerLabel')"
          :disabled="posting || disabled"
          required
        />
        <UiButton
          class="discussions-thread-view__send"
          button-type="submit"
          color="primary"
          :disabled="posting || disabled"
        >
          {{ t('discussions.view.sendMessage') }}
        </UiButton>
      </form>
    </template>
  </UiCard>
</template>

<script setup lang="ts">
import { computed, defineEmits, defineProps, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiInput from '@/components/ui/UiInput.vue';
import type { DiscussionMessage, DiscussionThread } from '@/discussions';
import { listMessages, postMessage } from '@/api/discussions';

const props = defineProps<{
  thread: DiscussionThread | null;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'message-sent', value: DiscussionMessage): void;
}>();

const { t } = useI18n();

const loading = ref(false);
const posting = ref(false);
const errorMessage = ref<string | null>(null);
const composer = ref('');
const messages = ref<DiscussionMessage[]>([]);
const page = ref(0);
const size = ref(20);
const total = ref(0);

const hasMore = computed(() => messages.value.length < total.value);

watch(
  () => props.thread?.id,
  () => {
    messages.value = [];
    page.value = 0;
    total.value = 0;
    composer.value = '';
    errorMessage.value = null;
    if (props.thread) {
      loadMessages(true);
    }
  },
  { immediate: true }
);

async function loadMessages(reset = false) {
  if (!props.thread) return;
  loading.value = true;
  try {
    const response = await listMessages(props.thread.id, {
      page: reset ? 0 : page.value,
      size: size.value
    });
    if (reset) {
      messages.value = response.items;
    } else {
      messages.value = [...messages.value, ...response.items];
    }
    total.value = response.total;
    page.value = response.page;
  } catch (error: any) {
    console.error('[ThreadView] failed to load messages', error);
    errorMessage.value = t('discussions.errors.loadMessages');
  } finally {
    loading.value = false;
  }
}

async function loadMore() {
  if (!props.thread || !hasMore.value || loading.value) return;
  page.value += 1;
  await loadMessages();
}

async function submitMessage() {
  if (!props.thread || !composer.value.trim()) {
    return;
  }
  posting.value = true;
  errorMessage.value = null;
  try {
    const message = await postMessage(props.thread.id, { body: composer.value.trim() });
    messages.value = [...messages.value, message];
    total.value += 1;
    composer.value = '';
    emit('message-sent', message);
  } catch (error: any) {
    console.error('[ThreadView] failed to post message', error);
    errorMessage.value = t('discussions.errors.postMessage');
  } finally {
    posting.value = false;
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
</script>

<style scoped>
.discussions-thread-view {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.discussions-thread-view__meta {
  display: flex;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--ui-text-muted, #6b7280);
}

.discussions-thread-view__messages {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 420px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.discussions-thread-view__messages.is-loading {
  opacity: 0.7;
  pointer-events: none;
}

.discussions-thread-view__message {
  border: 1px solid var(--ui-border-color, #e0e0e0);
  border-radius: 10px;
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background-color: rgba(22, 119, 255, 0.04);
}

.discussions-thread-view__message-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--ui-text-muted, #6b7280);
}

.discussions-thread-view__message-body {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.45;
}

.discussions-thread-view__composer {
  display: grid;
  gap: 0.75rem;
}

.discussions-thread-view__send {
  justify-self: flex-start;
}

.discussions-thread-view__load-more {
  align-self: center;
}

.discussions-thread-view__empty {
  text-align: center;
}

.discussions-thread-view__error {
  margin-bottom: 0.5rem;
}
</style>
