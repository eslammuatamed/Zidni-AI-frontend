<template>
  <ThemePage
    :title="assessment?.title || t('assessments.attemptsTitleDefault')"
    :subtitle="assessment ? t('assessments.attemptsSubtitle', { course: assessment.courseTitle }) : ''"
    :badge="assessment ? assessment.type.toUpperCase() : ''"
  >
    <template #actions>
      <UiButton variant="link" color="secondary" prepend-icon="ArrowLeftOutlined" @click="goBack">
        {{ t('assessments.backToBuilder') }}
      </UiButton>
    </template>

    <UiCard>
      <UiTable :headers="headers" :items="attemptRows" :no-data-text="t('assessments.noAttempts')">
        <template #item.student="{ item }">
          <div class="attempts__student flex flex-col">
            <span class="attempts__name font-medium">{{ item.studentName }}</span>
          </div>
        </template>
        <template #item.status="{ item }">
          <UiBadge :color="statusTone(item.status)" variant="outline">
            {{ formatStatus(item.status) }}
          </UiBadge>
        </template>
        <template #item.autoScore="{ item }">
          {{ formatNumber(item.autoScore) }}
        </template>
        <template #item.manualScore="{ item }">
          {{ formatNumber(item.manualScore) }}
        </template>
        <template #item.total="{ item }">
          {{ formatNumber(Number(item.autoScore ?? 0) + Number(item.manualScore ?? 0)) }}
        </template>
        <template #item.submittedAt="{ item }">
          {{ formatDate(item.submittedAt) }}
        </template>
        <template #item.actions="{ item }">
          <UiButton
            variant="link"
            color="primary"
            prepend-icon="EditOutlined"
            @click="openAttempt(item.id)"
          >
            {{ t('assessments.reviewAttempt') }}
          </UiButton>
        </template>
      </UiTable>
    </UiCard>

    <UiDialog
      v-model="attemptDialog"
      :title="currentAttempt ? t('assessments.overrideTitle', { name: currentAttempt.studentName }) : ''"
      width="760px"
    >
      <template v-if="currentAttempt">
        <UiAlert v-if="attemptForm.error" variant="outline" color="danger">
          {{ attemptForm.error }}
        </UiAlert>
        <div class="attempts__summary flex justify-between items-center gap-4 mb-4">
          <UiBadge :color="statusTone(currentAttempt.status)">
            {{ formatStatus(currentAttempt.status) }}
          </UiBadge>
          <dl class="attempts__scores grid grid-cols-2 gap-3">
            <div>
              <dt>{{ t('assessments.questionAuto') }}</dt>
              <dd>{{ formatNumber(currentAttempt.autoScore) }}</dd>
            </div>
            <div>
              <dt>{{ t('assessments.questionManual') }}</dt>
              <dd>{{ formatNumber(currentAttempt.manualScore ?? 0) }}</dd>
            </div>
          </dl>
        </div>
        <UiInput
          :model-value="attemptForm.manualScore ?? ''"
          type="number"
          min="0"
          :label="t('assessments.overrideManualTotal')"
          readonly
          disabled
        />
        <section class="attempts__questions flex flex-col gap-4 mt-5">
          <article v-for="question in attemptForm.questions" :key="question.id" class="attempts__question border border-border rounded-sakai-md p-4">
            <header>
              <h4>{{ question.position }}. {{ question.stem }}</h4>
              <div class="attempts__question-scores">
                <span>{{ t('assessments.questionAuto') }}: {{ formatNumber(question.autoScore) }}</span>
              </div>
            </header>
            <div class="attempts__question-body flex flex-col gap-3">
              <UiInput
                :model-value="question.manualScore ?? ''"
                type="number"
                min="0"
                :label="t('assessments.questionManual')"
                @update:model-value="(value) => { question.manualScore = value === '' ? 0 : Number(value); recalcManualTotal(); }"
              />
              <UiTextarea
                v-model="question.feedback"
                :label="t('assessments.feedbackLabel')"
                :rows="3"
              />
              <div v-if="selectedAttemptQuestion(question.id)?.selectedOptionKeys?.length" class="attempts__question-meta">
                <span>{{ t('assessments.selectedOptions') }}:</span>
                <span>{{ formatSelectedOptions(question.id) }}</span>
              </div>
              <div v-if="selectedAttemptQuestion(question.id)?.correctOptionKeys?.length" class="attempts__question-meta">
                <span>{{ t('assessments.correctAnswers') }}:</span>
                <span>{{ formatCorrectOptions(question.id) }}</span>
              </div>
              <div v-if="selectedAttemptQuestion(question.id)?.textAnswer" class="attempts__question-meta">
                <span>{{ t('assessments.textAnswer') }}:</span>
                <span>{{ selectedAttemptQuestion(question.id)?.textAnswer }}</span>
              </div>
            </div>
          </article>
        </section>
      </template>
      <template #footer>
        <UiButton variant="link" color="secondary" @click="closeAttempt">
          {{ t('common.cancel') }}
        </UiButton>
        <UiButton color="primary" :disabled="attemptForm.loading" @click="saveAttemptOverride">
          {{ t('assessments.saveOverride') }}
        </UiButton>
      </template>
    </UiDialog>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAssessmentsStore } from '@/stores/assessments';
import { useI18n } from 'vue-i18n';
import {
  type AssessmentAttemptSummary,
  type AssessmentDetailResponse,
  type AssessmentAttemptResponse
} from '@/services/assessments';

const store = useAssessmentsStore();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const assessmentId = computed(() => Number(route.params.assessmentId));
const assessment = computed<AssessmentDetailResponse | null>(() => store.currentAssessment);
const attempts = computed<AssessmentAttemptSummary[]>(() => store.attempts);
const attemptRows = computed(() => attempts.value.map((attempt) => ({
  ...attempt,
  manualScore: attempt.manualScore ?? 0
})));

const headers = computed(() => [
  { title: t('assessments.attemptsTableStudent'), key: 'student' },
  { title: t('assessments.tableStatus'), key: 'status' },
  { title: t('assessments.attemptsTableAuto'), key: 'autoScore' },
  { title: t('assessments.attemptsTableManual'), key: 'manualScore' },
  { title: t('assessments.attemptsTableTotal'), key: 'total' },
  { title: t('assessments.attemptsTableSubmitted'), key: 'submittedAt' },
  { title: '', key: 'actions', sortable: false }
]);

const attemptDialog = ref(false);
const currentAttempt = computed<AssessmentAttemptResponse | null>(() => store.currentAttempt);
const attemptForm = reactive({
  manualScore: null as number | null,
  questions: [] as Array<{
    id: number;
    position: number;
    stem: string;
    autoScore: number;
    manualScore: number;
    feedback: string;
  }>,
  loading: false,
  error: ''
});

const recalcManualTotal = () => {
  const total = attemptForm.questions.reduce((acc, question) => acc + Number(question.manualScore ?? 0), 0);
  attemptForm.manualScore = Number(total.toFixed(2));
};

const mapAttemptQuestions = (attempt: AssessmentAttemptResponse | null) => {
  if (!attempt) {
    return [] as Array<{
      id: number;
      position: number;
      stem: string;
      autoScore: number;
      manualScore: number;
      feedback: string;
    }>;
  }
  const seen = new Set<number>();
  return attempt.questions
    .slice()
    .sort((a, b) => a.position - b.position)
    .filter((question) => {
      if (seen.has(question.id)) {
        return false;
      }
      seen.add(question.id);
      return true;
    })
    .map((question) => ({
      id: question.id,
      position: question.position,
      stem: stemByQuestionId.value.get(question.questionId) ||
        t('assessments.questionFallback', { position: question.position }),
      autoScore: Number(question.autoScore ?? 0),
      manualScore: Number(question.manualScore ?? 0),
      feedback: question.feedback ?? ''
    }));
};

const statusTone = (status: string) => {
  const lowered = status.toLowerCase();
  if (lowered === 'graded') return 'success';
  if (lowered === 'submitted' || lowered === 'pending_result') return 'warning';
  if (lowered === 'void') return 'danger';
  return 'info';
};

const formatStatus = (status: string) => {
  switch (status.toLowerCase()) {
    case 'graded':
      return t('assessments.statusGraded');
    case 'submitted':
      return t('assessments.statusPending');
    case 'pending_result':
      return t('assessments.statusPendingResult');
    case 'void':
      return t('assessments.statusVoided');
    default:
      return status.toUpperCase();
  }
};

const formatNumber = (value: number | null | undefined) => Number(value ?? 0).toFixed(1);

const formatDate = (value: string | Date | null | undefined) => {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleString();
};

const stemByQuestionId = computed(() => {
  const map = new Map<number, string>();
  assessment.value?.items.forEach((item) => {
    map.set(item.questionId, item.stem);
  });
  return map;
});

watch(currentAttempt, (attempt) => {
  if (!attempt) {
    attemptForm.questions = [];
    attemptForm.manualScore = null;
    return;
  }
  attemptForm.questions = mapAttemptQuestions(attempt);
  recalcManualTotal();
  attemptForm.error = '';
});

const selectedAttemptQuestion = (questionId: number) =>
  currentAttempt.value?.questions.find((question) => question.id === questionId);

const displayOptionLabel = (
  option: AssessmentAttemptResponse['questions'][number]['options'][number],
  index: number
) => {
  if (option.label?.trim()) {
    return option.label.trim();
  }
  return String.fromCharCode(65 + index);
};

const formatOptionKeys = (questionId: number, keys: string[] | null | undefined) => {
  const question = selectedAttemptQuestion(questionId);
  if (!question || !keys?.length) {
    return '—';
  }
  return keys
    .map((key) => {
      const index = question.options.findIndex((option) => option.key === key);
      const option = index >= 0 ? question.options[index] : null;
      if (!option) {
        return key;
      }
      return `${displayOptionLabel(option, index)}. ${option.text}`;
    })
    .join(', ');
};

const formatSelectedOptions = (questionId: number) =>
  formatOptionKeys(questionId, selectedAttemptQuestion(questionId)?.selectedOptionKeys);

const formatCorrectOptions = (questionId: number) =>
  formatOptionKeys(questionId, selectedAttemptQuestion(questionId)?.correctOptionKeys);

const openAttempt = async (attemptId: number) => {
  attemptForm.loading = true;
  try {
    await store.loadAttemptDetail(assessmentId.value, attemptId);
    attemptDialog.value = true;
  } finally {
    attemptForm.loading = false;
  }
};

const closeAttempt = () => {
  attemptDialog.value = false;
  // reset shared state so builder view reflects closed dialog
  store.currentAttempt = null;
};

const saveAttemptOverride = async () => {
  if (!currentAttempt.value) {
    return;
  }
  attemptForm.loading = true;
  attemptForm.error = '';
  try {
    recalcManualTotal();
    await store.overrideAttempt(assessmentId.value, currentAttempt.value.id, {
      manualScore: attemptForm.manualScore,
      questions: attemptForm.questions.map((question) => ({
        attemptQuestionId: question.id,
        manualScore: question.manualScore,
        feedback: question.feedback || null
      }))
    });
    attemptDialog.value = false;
  } catch (error) {
    console.error('Failed to save override', error);
    attemptForm.error = t('assessments.overrideError');
  } finally {
    attemptForm.loading = false;
  }
};

const goBack = () => {
  router.push({ name: 'teacher-assessment-builder', params: { assessmentId: assessmentId.value } });
};

onMounted(async () => {
  await store.loadAssessment(assessmentId.value);
  await store.loadAttempts(assessmentId.value);
});
</script>

<style scoped>
.attempts__scores dt {
  font-size: var(--sakai-font-size-sm);
  color: var(--sakai-text-muted);
}

.attempts__scores dd {
  font-weight: var(--sakai-font-weight-medium);
}

.attempts__question header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--sakai-space-3);
}

.attempts__question h4 {
  margin: 0;
  font-size: var(--sakai-font-size-md);
}

.attempts__question-meta {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-1);
  font-size: var(--sakai-font-size-sm);
  color: var(--sakai-text-muted);
}

@media (max-width: 768px) {
  .attempts__summary {
    flex-direction: column;
    align-items: flex-start;
  }

  .attempts__scores {
    grid-template-columns: 1fr;
  }
}
</style>
