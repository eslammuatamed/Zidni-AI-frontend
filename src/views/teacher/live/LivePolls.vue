<template>
  <ThemePage :title="t('live.polls.teacher.titlePage')" :subtitle="t('live.polls.teacher.subtitle')">
    <template #actions>
      <div class="polls-actions">
        <UiButton variant="outline" color="secondary" prepend-icon="ReloadOutlined" @click="reloadAll">
          {{ t('common.refresh') }}
        </UiButton>
        <UiButton color="primary" prepend-icon="PlusOutlined" :disabled="!selectedSession" @click="openCreate">
          {{ t('live.polls.teacher.newPoll') }}
        </UiButton>
      </div>
    </template>

    <section class="polls-content">
      <UiCard class="polls-card" hover>
        <div class="polls-controls">
          <UiSelect v-model="selectedSessionIdString" :label="t('live.polls.teacher.selectSession')">
            <option value="">{{ t('live.polls.teacher.selectPlaceholder') }}</option>
            <option v-for="session in sessions" :key="session.id" :value="String(session.id)">
              {{ session.title }} — {{ session.courseTitle }}
            </option>
          </UiSelect>
        </div>

        <UiAlert v-if="error" color="danger" variant="soft">{{ error }}</UiAlert>
        <UiAlert v-else-if="!selectedSession" color="neutral" variant="soft">
          {{ t('live.polls.teacher.noSessionSelected') }}
        </UiAlert>
        <UiAlert v-else-if="!loading && !polls.length" color="neutral" variant="soft">
          {{ t('live.polls.teacher.emptyState') }}
        </UiAlert>

        <ul v-else class="polls-list">
          <li v-for="poll in polls" :key="poll.pollId" class="polls-item">
            <header class="polls-item__header">
              <div>
                <h3>{{ poll.question }}</h3>
                <p class="polls-item__meta">
                  <span>{{ t('live.polls.teacher.kindLabel') }}: {{ kindLabel(poll.kind) }}</span>
                  <span>{{ t('live.polls.teacher.totalResponses', { count: poll.totalResponses }) }}</span>
                </p>
              </div>
              <UiButton size="sm" variant="outline" color="primary" @click="viewResults(poll)">
                {{ t('live.polls.teacher.viewResults') }}
              </UiButton>
            </header>
            <ol class="polls-item__options">
              <li v-for="option in poll.options" :key="option.id">
                <span class="polls-option__text">{{ option.text }}</span>
              </li>
            </ol>
          </li>
        </ul>
      </UiCard>
    </section>

    <UiDialog v-model="showForm" :title="t('live.polls.teacher.formTitle')" width="560px">
      <form class="polls-form" @submit.prevent="submitPoll">
        <UiInput v-model="form.question" :label="t('live.polls.teacher.questionLabel')" required />
        <UiSelect v-model="form.kind" :label="t('live.polls.teacher.kindLabel')">
          <option v-for="kind in pollKinds" :key="kind.value" :value="kind.value">
            {{ kind.label }}
          </option>
        </UiSelect>
        <div class="polls-form__options">
          <label class="polls-form__label">{{ t('live.polls.teacher.optionsLabel') }}</label>
          <div v-for="(option, index) in form.options" :key="option.uid" class="polls-form__option">
            <UiInput v-model="option.text" :label="t('live.polls.teacher.optionLabel', { index: index + 1 })" required />
            <div class="polls-form__option-actions">
              <UiButton
                type="button"
                size="sm"
                variant="link"
                color="danger"
                :disabled="form.options.length <= 2"
                @click="removeOption(index)"
              >
                {{ t('common.remove') }}
              </UiButton>
            </div>
          </div>
          <UiButton type="button" size="sm" variant="link" color="primary" @click="addOption">
            {{ t('live.polls.teacher.addOption') }}
          </UiButton>
        </div>
        <UiAlert v-if="formError" color="danger" variant="soft">{{ formError }}</UiAlert>
        <div class="polls-form__actions">
          <UiButton type="button" variant="ghost" @click="closeForm">{{ t('common.cancel') }}</UiButton>
          <UiButton type="submit" color="primary" :disabled="submitting">
            {{ submitting ? t('common.saving') : t('common.save') }}
          </UiButton>
        </div>
      </form>
    </UiDialog>

    <UiDialog v-model="showResults" :title="t('live.polls.teacher.resultsTitle')" width="520px">
      <div v-if="!activeResults" class="polls-results__empty">
        <UiAlert color="neutral" variant="soft">{{ t('live.polls.teacher.noResults') }}</UiAlert>
      </div>
      <div v-else class="polls-results">
        <h3>{{ activeResults.question }}</h3>
        <p class="polls-item__meta">
          <span>{{ t('live.polls.teacher.kindLabel') }}: {{ kindLabel(activeResults.kind) }}</span>
          <span>{{ t('live.polls.teacher.totalResponses', { count: activeResults.totalResponses }) }}</span>
        </p>
        <ol class="polls-item__options">
          <li v-for="option in activeResults.options" :key="option.id">
            <div class="polls-results__row">
              <span class="polls-option__text">{{ option.text }}</span>
              <span class="polls-results__count">{{ option.voteCount ?? 0 }}</span>
            </div>
          </li>
        </ol>
      </div>
    </UiDialog>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ThemePage from '@/layout/theme/ThemePage.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiDialog from '@/components/ui/UiDialog.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import { useToast } from '@/composables/useToast';
import {
  listTeacherSessions,
  type TeacherLiveSession,
  type TeacherLiveSessionsPage
} from '@/api/live';
import {
  createTeacherPoll,
  getTeacherPollResults,
  listTeacherPolls,
  type LivePollOption,
  type TeacherLivePoll,
  type TeacherLivePollResults
} from '@/api/livePolls';

const { t } = useI18n();
const toast = useToast();

const sessions = ref<TeacherLiveSession[]>([]);
const polls = ref<TeacherLivePoll[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const showForm = ref(false);
const showResults = ref(false);
const submitting = ref(false);
const formError = ref<string | null>(null);
const activeResults = ref<TeacherLivePollResults | null>(null);

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
  return sessions.value.find((item) => item.id === selectedSessionId.value) ?? null;
});

const pollKinds = computed(() => [
  { value: 'single', label: t('live.polls.teacher.kindSingle') },
  { value: 'multi', label: t('live.polls.teacher.kindMulti') },
  { value: 'mcq', label: t('live.polls.teacher.kindMcq') }
]);

const form = reactive({
  question: '',
  kind: 'single',
  options: [createOption(), createOption()]
});

function createOption(text = '') {
  return { uid: Math.random().toString(36).slice(2), text };
}

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
    const { items }: TeacherLiveSessionsPage = await listTeacherSessions({ size: 50 });
    sessions.value = items;
  } catch (err) {
    error.value = t('live.polls.teacher.loadFailed');
  } finally {
    loading.value = false;
  }
}

async function loadPolls(sessionId: number) {
  loading.value = true;
  error.value = null;
  try {
    polls.value = await listTeacherPolls(sessionId);
  } catch (err) {
    error.value = t('live.polls.teacher.loadPollsFailed');
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  if (!selectedSession.value) {
    return;
  }
  resetForm();
  showForm.value = true;
}

function closeForm() {
  showForm.value = false;
}

function addOption() {
  form.options.push(createOption());
}

function removeOption(index: number) {
  if (form.options.length <= 2) {
    return;
  }
  form.options.splice(index, 1);
}

function resetForm() {
  form.question = '';
  form.kind = 'single';
  form.options = [createOption(), createOption()];
  formError.value = null;
}

async function submitPoll() {
  if (!selectedSession.value) {
    return;
  }
  if (!form.question.trim()) {
    formError.value = t('live.polls.teacher.validation.question');
    return;
  }
  const validOptions = form.options.map((option, index) => ({
    text: option.text.trim(),
    position: index
  }));
  if (validOptions.some((option) => !option.text)) {
    formError.value = t('live.polls.teacher.validation.option');
    return;
  }
  submitting.value = true;
  formError.value = null;
  try {
    await createTeacherPoll(selectedSession.value.id, {
      question: form.question.trim(),
      kind: form.kind,
      options: validOptions
    });
    toast.success(t('live.polls.teacher.createSuccess'));
    showForm.value = false;
    await loadPolls(selectedSession.value.id);
  } catch (err) {
    formError.value = t('live.polls.teacher.createFailed');
  } finally {
    submitting.value = false;
  }
}

async function viewResults(poll: TeacherLivePoll) {
  try {
    activeResults.value = await getTeacherPollResults(poll.pollId);
    showResults.value = true;
  } catch (err) {
    toast.error(t('live.polls.teacher.resultsFailed'));
  }
}

function reloadAll() {
  if (selectedSession.value) {
    loadPolls(selectedSession.value.id);
  }
}

function kindLabel(kind: string) {
  const entry = pollKinds.value.find((item) => item.value === kind);
  return entry ? entry.label : kind;
}

watch(showResults, (value) => {
  if (!value) {
    activeResults.value = null;
  }
});
</script>

<style scoped>
.polls-actions {
  display: flex;
  gap: 0.75rem;
}

.polls-content {
  margin-top: 1.5rem;
}

.polls-card {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.polls-controls {
  display: grid;
  grid-template-columns: minmax(0, 320px);
}

.polls-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.polls-item__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.polls-item__meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: var(--theme-text-muted);
}

.polls-item__options {
  margin: 0.75rem 0 0;
  padding-left: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.polls-option__text {
  font-weight: 500;
}

.polls-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.polls-form__options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.polls-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.polls-form__label {
  font-weight: 600;
}

.polls-form__option {
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
}

.polls-form__option-actions {
  display: flex;
  align-items: center;
}

.polls-results__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.polls-results__count {
  font-weight: 600;
}

.polls-results__empty {
  padding: 1rem 0;
}
</style>
