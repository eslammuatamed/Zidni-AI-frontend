<template>
  <ThemePage :title="t('live.polls.student.titlePage')" :subtitle="t('live.polls.student.subtitle')">
    <template #actions>
      <UiButton variant="outline" color="secondary" prepend-icon="ReloadOutlined" @click="reload">
        {{ t('common.refresh') }}
      </UiButton>
    </template>

    <section class="student-polls">
      <UiCard class="student-polls__card" hover>
        <div class="student-polls__controls">
          <UiSelect v-model="selectedSessionIdString" :label="t('live.polls.student.selectSession')">
            <option value="">{{ t('live.polls.student.selectPlaceholder') }}</option>
            <option v-for="session in sessions" :key="session.sessionId" :value="String(session.sessionId)">
              {{ session.title }} — {{ session.courseTitle }}
            </option>
          </UiSelect>
        </div>

        <UiAlert v-if="error" color="danger" variant="soft">{{ error }}</UiAlert>
        <UiAlert v-else-if="!loading && selectedSession && !polls.length" color="neutral" variant="soft">
          {{ t('live.polls.student.emptyState') }}
        </UiAlert>
        <UiAlert v-else-if="!selectedSession" color="neutral" variant="soft">
          {{ t('live.polls.student.noSessionSelected') }}
        </UiAlert>

        <div v-else class="student-polls__list">
          <article v-for="poll in polls" :key="poll.pollId" class="student-polls__item">
            <header class="student-polls__header">
              <h3>{{ poll.question }}</h3>
              <UiTag size="sm" color="primary">{{ kindLabel(poll.kind) }}</UiTag>
            </header>
            <p v-if="poll.responded" class="student-polls__status">{{ t('live.polls.student.alreadyResponded') }}</p>
            <form class="student-polls__form" @submit.prevent="submitResponse(poll)">
              <div class="student-polls__options">
                <label
                  v-for="option in poll.options"
                  :key="option.id"
                  class="student-polls__option"
                >
                  <input
                    :type="isMulti(poll.kind) ? 'checkbox' : 'radio'"
                    :name="`poll-${poll.pollId}`"
                    :value="option.id"
                    :checked="isSelected(poll.pollId, option.id)"
                    :disabled="poll.responded || submittingIds.value.has(poll.pollId)"
                    @change="toggleSelection(poll, option.id, $event)"
                  />
                  <span>{{ option.text }}</span>
                </label>
              </div>
              <div class="student-polls__actions">
                <UiButton
                  type="submit"
                  size="sm"
                  color="primary"
                  :disabled="poll.responded || submittingIds.value.has(poll.pollId) || !hasSelection(poll.pollId)"
                >
                  {{ t('live.polls.student.submitResponse') }}
                </UiButton>
              </div>
            </form>
          </article>
        </div>
      </UiCard>
    </section>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ThemePage from '@/layout/theme/ThemePage.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiTag from '@/components/ui/UiTag.vue';
import { useToast } from '@/composables/useToast';
import { listStudentSessions, type StudentLiveSession } from '@/api/live';
import {
  listStudentPolls,
  respondToPoll,
  type StudentLivePoll,
  type StudentLivePollsResponse
} from '@/api/livePolls';

const { t } = useI18n();
const toast = useToast();

const sessions = ref<StudentLiveSession[]>([]);
const polls = ref<StudentLivePoll[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const submittingIds = ref(new Set<number>());

const selections = reactive<Record<number, number[]>>({});

const selectedSessionIdString = ref('');

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

watch(selectedSessionId, async (value) => {
  if (!value) {
    polls.value = [];
    return;
  }
  await loadPolls(value);
});

onMounted(async () => {
  await loadSessions();
});

async function loadSessions() {
  loading.value = true;
  error.value = null;
  try {
    const response = await listStudentSessions({ size: 50 });
    sessions.value = response.items;
  } catch (err) {
    error.value = t('live.polls.student.loadFailed');
  } finally {
    loading.value = false;
  }
}

async function loadPolls(sessionId: number) {
  loading.value = true;
  error.value = null;
  try {
    const { items }: StudentLivePollsResponse = await listStudentPolls(sessionId);
    polls.value = items;
    selectionsReset(items);
  } catch (err) {
    error.value = t('live.polls.student.loadPollsFailed');
  } finally {
    loading.value = false;
  }
}

function selectionsReset(items: StudentLivePoll[]) {
  Object.keys(selections).forEach((key) => {
    delete selections[Number(key)];
  });
  items.forEach((poll) => {
    selections[poll.pollId] = [...poll.selectedOptionIds];
  });
}

function isMulti(kind: string) {
  return kind === 'multi' || kind === 'mcq';
}

function toggleSelection(poll: StudentLivePoll, optionId: number, event: Event) {
  const current = selections[poll.pollId] ? [...selections[poll.pollId]] : [];
  const target = event.target as HTMLInputElement;
  if (isMulti(poll.kind)) {
    if (target.checked) {
      if (!current.includes(optionId)) {
        current.push(optionId);
      }
    } else {
      const index = current.indexOf(optionId);
      if (index >= 0) {
        current.splice(index, 1);
      }
    }
    selections[poll.pollId] = current;
  } else {
    selections[poll.pollId] = target.checked ? [optionId] : [];
  }
}

function isSelected(pollId: number, optionId: number) {
  return selections[pollId]?.includes(optionId) ?? false;
}

function hasSelection(pollId: number) {
  const values = selections[pollId];
  return Array.isArray(values) && values.length > 0;
}

async function submitResponse(poll: StudentLivePoll) {
  if (poll.responded) {
    return;
  }
  const selected = selections[poll.pollId];
  if (!selected || selected.length === 0) {
    return;
  }
  const adding = new Set(submittingIds.value);
  adding.add(poll.pollId);
  submittingIds.value = adding;
  try {
    const response = await respondToPoll(poll.pollId, {
      selectedOptionIds: [...selected]
    });
    toast.success(t('live.polls.student.submitSuccess'));
    const nextPolls = polls.value.map((item) => (item.pollId === poll.pollId ? response : item));
    polls.value = nextPolls;
    selections[poll.pollId] = [...response.selectedOptionIds];
  } catch (err) {
    toast.error(t('live.polls.student.submitFailed'));
  } finally {
    const removing = new Set(submittingIds.value);
    removing.delete(poll.pollId);
    submittingIds.value = removing;
  }
}

function reload() {
  if (selectedSession.value) {
    loadPolls(selectedSession.value.sessionId);
  } else {
    loadSessions();
  }
}

function kindLabel(kind: string) {
  switch (kind) {
    case 'multi':
      return t('live.polls.student.kindMulti');
    case 'mcq':
      return t('live.polls.student.kindMcq');
    default:
      return t('live.polls.student.kindSingle');
  }
}

</script>

<style scoped>
.student-polls {
  margin-top: 1.5rem;
}

.student-polls__card {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.student-polls__controls {
  display: grid;
  grid-template-columns: minmax(0, 320px);
}

.student-polls__list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.student-polls__item {
  border: 1px solid var(--theme-border-subtle);
  border-radius: 0.75rem;
  padding: 1rem;
  background-color: var(--theme-surface-raised);
}

.student-polls__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.student-polls__status {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--theme-text-muted);
}

.student-polls__form {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.student-polls__options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.student-polls__option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
}

.student-polls__actions {
  display: flex;
  justify-content: flex-end;
}
</style>
