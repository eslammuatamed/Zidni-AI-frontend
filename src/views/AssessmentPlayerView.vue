<template>
   <ThemePage
 
    :title="assessment?.title || ''"
    :subtitle="assessment ? t('assessments.playerSubtitle', { minutes: assessment.durationMinutes }) : ''"
    :badge="assessment ? assessment.type.toUpperCase() : ''"
  >
    <template #actions>
      <UiButton variant="link" color="secondary" prepend-icon="ArrowLeftOutlined" @click="goBack">
        {{ t('assessments.backToList') }}
      </UiButton>
    </template>

    <UiAlert v-if="error" variant="outline" color="danger">
      {{ error }}
    </UiAlert>
    <UiAlert v-else-if="statusBanner" variant="soft" :color="statusTone">
      {{ statusBanner }}
    </UiAlert>

    <UiCard v-if="assessment" class="assessment-player">
      <div class="assessment-player__meta">
        <UiBadge color="primary" variant="soft">{{ assessment.type.toUpperCase() }}</UiBadge>
        <UiBadge color="secondary" variant="soft">
          {{
            isReadOnly
              ? t('assessments.reviewMode')
              : t('assessments.timeRemaining', { time: formattedTime })
          }}
        </UiBadge>
      </div>

      <div
        class="assessment-player__progress"
        role="progressbar"
        :aria-valuenow="progress"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div class="assessment-player__progress-track">
          <div class="assessment-player__progress-value" :style="{ '--progress': `${progress}%` }"></div>

        </div>
        <span class="assessment-player__progress-text">{{ progress }}%</span>
      </div>

      <UiAlert v-if="isExternalForm" variant="soft" color="info" class="assessment-player__external-hint">
        {{ t('assessments.playerExternalNotice') }}
      </UiAlert>

      <div v-if="isExternalForm" class="assessment-player__embed">
        <iframe
          v-if="embedUrl"
          :src="embedUrl"
          title="Embedded assessment form"
          class="assessment-player__embed-frame"
          allow="fullscreen"
          sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
          referrerpolicy="strict-origin-when-cross-origin"
        ></iframe>
        <UiAlert v-else variant="outline" color="warning">
          {{ t('assessments.embedUrlHint') }}
        </UiAlert>
      </div>

      <div v-else class="assessment-player__questions">
        <article
          v-if="currentQuestion && answers[currentQuestion.itemId]"
          :key="currentQuestion.itemId"
          class="assessment-player__question"
        >
          <header class="assessment-player__question-header">
            <div class="assessment-player__question-title">
              <span class="assessment-player__question-counter">
                {{
                  t('assessments.questionProgress', {
                    current: currentQuestionNumber,
                    total: totalQuestions
                  })
                }}
              </span>
              <h3>{{ currentQuestion.stem }}</h3>
            </div>
            <UiBadge color="secondary" variant="outline">
              {{ currentQuestion.points }} {{ t('assessments.pointsLabel') }}
            </UiBadge>
          </header>
          <div class="assessment-player__question-body">
            <template v-if="currentQuestion.type === 'mcq_single'">
              <fieldset class="assessment-player__options">
                <legend class="sr-only">{{ currentQuestion.stem }}</legend>
                <label
                  v-for="option in optionOrder[currentQuestion.itemId] || []"
                  :key="option.id"
                  :class="[
                    'assessment-player__option',
                    {
                      'assessment-player__option--selected': isSelectedOption(currentQuestion.itemId, option.key),
                      'assessment-player__option--correct': shouldRevealCorrectAnswers && isCorrectOption(currentQuestion.itemId, option.key),
                      'assessment-player__option--incorrect': shouldRevealCorrectAnswers && isSelectedOption(currentQuestion.itemId, option.key) && !isCorrectOption(currentQuestion.itemId, option.key)
                    }
                  ]"
                >
                  <input
                    type="radio"
                    :name="`question-${currentQuestion.itemId}`"
                    :value="option.key"
                    :checked="
                      answers[currentQuestion.itemId].selected[0] === option.key
                    "
                    @change="updateSingleAnswer(currentQuestion.itemId, option.key)"
                    :disabled="isReadOnly"
                  />
                  <span class="assessment-player__option-text">{{ displayOptionLabel(option) }}. {{ option.text }}</span>
                </label>
              </fieldset>
            </template>
            <template v-else-if="currentQuestion.type === 'mcq_multi'">
              <fieldset class="assessment-player__options">
                <legend class="sr-only">{{ currentQuestion.stem }}</legend>
                <label
                  v-for="option in optionOrder[currentQuestion.itemId] || []"
                  :key="option.id"
                  :class="[
                    'assessment-player__option',
                    {
                      'assessment-player__option--selected': isSelectedOption(currentQuestion.itemId, option.key),
                      'assessment-player__option--correct': shouldRevealCorrectAnswers && isCorrectOption(currentQuestion.itemId, option.key),
                      'assessment-player__option--incorrect': shouldRevealCorrectAnswers && isSelectedOption(currentQuestion.itemId, option.key) && !isCorrectOption(currentQuestion.itemId, option.key)
                    }
                  ]"
                >
                  <input
                    type="checkbox"
                    :value="option.key"
                    v-model="answers[currentQuestion.itemId].selected"
                    :disabled="isReadOnly"
                  />
                  <span class="assessment-player__option-text">{{ displayOptionLabel(option) }}. {{ option.text }}</span>
                </label>
              </fieldset>
            </template>
            <template v-else-if="currentQuestion.type === 'truefalse'">
              <fieldset class="assessment-player__options assessment-player__options--inline">
                <legend class="sr-only">{{ currentQuestion.stem }}</legend>
                <label class="assessment-player__option">
                  <input
                    type="radio"
                    :name="`question-${currentQuestion.itemId}`"
                    value="true"
                    :checked="answers[currentQuestion.itemId].selected[0] === 'true'"
                    @change="updateSingleAnswer(currentQuestion.itemId, 'true')"
                    :disabled="isReadOnly"
                  />
                  <span class="assessment-player__option-text">{{ t('assessments.true') }}</span>
                </label>
                <label class="assessment-player__option">
                  <input
                    type="radio"
                    :name="`question-${currentQuestion.itemId}`"
                    value="false"
                    :checked="answers[currentQuestion.itemId].selected[0] === 'false'"
                    @change="updateSingleAnswer(currentQuestion.itemId, 'false')"
                    :disabled="isReadOnly"
                  />
                  <span class="assessment-player__option-text">{{ t('assessments.false') }}</span>
                </label>
              </fieldset>
            </template>
            <template v-else>
              <UiTextarea
                v-model="answers[currentQuestion.itemId].text"
                :label="t('assessments.shortAnswerLabel')"
                :rows="4"
                :disabled="isReadOnly"
              />
            </template>
          </div>
          <div v-if="currentAttemptQuestion" class="assessment-player__review">
            <UiBadge
              v-if="latestStatus === 'graded'"
              :color="currentAttemptQuestion.correct ? 'success' : 'warning'"
              variant="soft"
            >
              {{
                currentAttemptQuestion.correct
                  ? t('assessments.questionCorrect')
                  : t('assessments.questionIncorrect')
              }}
            </UiBadge>
            <p v-if="reviewAnswerSummary" class="assessment-player__review-line">
              <strong>{{ t('assessments.yourAnswer') }}:</strong> {{ reviewAnswerSummary }}
            </p>
            <p
              v-if="shouldRevealCorrectAnswers && reviewCorrectAnswerSummary"
              class="assessment-player__review-line"
            >
              <strong>{{ t('assessments.correctAnswers') }}:</strong> {{ reviewCorrectAnswerSummary }}
            </p>
            <p
              v-else-if="latestStatus === 'graded' && !shouldRevealCorrectAnswers"
              class="assessment-player__review-line"
            >
              {{ t('assessments.correctAnswersHidden') }}
            </p>
            <p v-if="currentAttemptQuestion.feedback" class="assessment-player__review-line">
              <strong>{{ t('assessments.feedbackLabel') }}:</strong> {{ currentAttemptQuestion.feedback }}
            </p>
            <p v-if="latestStatus === 'graded'" class="assessment-player__review-line">
              <strong>{{ t('assessments.scoreLabel') }}:</strong>
              {{ questionScore(currentAttemptQuestion) }} / {{ currentAttemptQuestion.points }}
            </p>
          </div>
        </article>
      </div>

      <div v-if="!isExternalForm" class="assessment-player__actions">
        <UiButton
          variant="outline"
          color="secondary"
          prepend-icon="ArrowLeftOutlined"
          :disabled="isFirstQuestion"
          @click="goToPreviousQuestion"
        >
          {{ t('assessments.previousQuestion') }}
        </UiButton>

        <div class="assessment-player__actions-group">
          <UiButton
            v-if="!isLastQuestion"
            color="primary"
            variant="outline"
            append-icon="ArrowRightOutlined"
            :disabled="!currentQuestion || !totalQuestions"
            @click="goToNextQuestion"
          >
            {{ t('assessments.nextQuestion') }}
          </UiButton>
          <UiButton
            v-else
            color="primary"
            :disabled="submitting || isReadOnly"
            @click="submit"
          >
            {{ isReadOnly ? t('assessments.submitDisabled') : t('assessments.submitAttempt') }}
          </UiButton>
        </div>
      </div>
    </UiCard>

    <div v-else class="assessment-player__skeleton">
      <div class="assessment-player__skeleton-badge"></div>
      <div class="assessment-player__skeleton-progress"></div>
      <div class="assessment-player__skeleton-list">
        <div
          v-for="index in 3"
          :key="`player-skeleton-${index}`"
          class="assessment-player__skeleton-card"
        >
          <div class="assessment-player__skeleton-line assessment-player__skeleton-line--title"></div>
          <div class="assessment-player__skeleton-line"></div>
          <div class="assessment-player__skeleton-line assessment-player__skeleton-line--short"></div>
        </div>
      </div>
    </div>

    <UiDialog v-model="resultDialog" :title="t('assessments.resultTitle')" width="440px">
      <template v-if="store.lastStudentAttempt">
        <div class="assessment-player__result">
          <UiBadge :color="statusColor(store.lastStudentAttempt.status)">
            {{ formatAttemptStatus(store.lastStudentAttempt.status) }}
          </UiBadge>
          <p v-if="store.lastStudentAttempt.status === 'graded'">
            {{
              t('assessments.resultScore', {
                score: (store.lastStudentAttempt.autoScore + (store.lastStudentAttempt.manualScore || 0)).toFixed(1),
                status: formatAttemptStatus(store.lastStudentAttempt.status)
              })
            }}
          </p>
          <p v-else>
            {{ t('assessments.pendingReviewMessage') }}
          </p>
          <p>
            {{ t('assessments.submittedAt') }}:
            {{
              store.lastStudentAttempt.submittedAt
                ? new Date(store.lastStudentAttempt.submittedAt).toLocaleString()
                : '-'
            }}
          </p>
        </div>
 
      </template>
      <template #footer>
        <UiButton variant="link" color="secondary" @click="closeResult">
          {{ t('common.close') }}
        </UiButton>
        <UiButton color="primary" @click="goBack">
          {{ t('assessments.backToList') }}
        </UiButton>
      </template>
    </UiDialog>
 
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAssessmentsStore } from '@/stores/assessments';
import { useI18n } from 'vue-i18n';
import type { AssessmentPlayQuestionResponse, AttemptQuestionResponse } from '@/services/assessments';
import UiTextarea from '@/components/ui/UiTextarea.vue';
import UiDialog from '@/components/ui/UiDialog.vue';

const store = useAssessmentsStore();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const assessmentId = computed(() => Number(route.params.assessmentId));
const assessment = computed(() => store.currentStudentAssessment);
const isExternalForm = computed(() => assessment.value?.type === 'external_form');
const embedUrl = computed(() => assessment.value?.embedUrl?.trim() ?? '');
const assessmentSummary = computed(() =>
  store.studentAssessments.find((summary) => summary.id === assessmentId.value) ?? null
);
const latestStatus = computed(() =>
  assessmentSummary.value?.latestAttemptStatus?.toString().toLowerCase() ?? ''
);
const retakeMode = computed(
  () =>
    route.query.mode === 'retake' &&
    latestStatus.value === 'graded' &&
    (assessmentSummary.value?.attemptsUsed ?? 0) < (assessmentSummary.value?.maxAttempts ?? 1)
);
const reviewAttempt = computed(() => store.currentStudentAttempt);
const isReadOnly = computed(
  () =>
    !retakeMode.value &&
    (latestStatus.value === 'submitted' ||
      latestStatus.value === 'pending_result' ||
      latestStatus.value === 'graded')
);
const shouldRevealCorrectAnswers = computed(
  () => !retakeMode.value && latestStatus.value === 'graded' && Boolean(assessment.value?.revealAnswersAfterGrading)
);
const statusBanner = computed(() => {
  if (retakeMode.value) {
    return t('assessments.bannerRetake');
  }
  if (latestStatus.value === 'submitted' || latestStatus.value === 'pending_result') {
    return t('assessments.bannerPendingReview');
  }
  if (latestStatus.value === 'graded') {
    const auto = Number(assessmentSummary.value?.latestAutoScore ?? 0);
    const manual = Number(assessmentSummary.value?.latestManualScore ?? 0);
    const total = (auto + manual).toFixed(1);
    return t('assessments.bannerGraded', {
      score: total,
      max: assessmentSummary.value?.maxScore ?? 0
    });
  }
  return '';
});
const statusTone = computed(() => {
  if (retakeMode.value) {
    return 'info';
  }
  if (latestStatus.value === 'submitted' || latestStatus.value === 'pending_result') {
    return 'warning';
  }
  if (latestStatus.value === 'graded') {
    return 'success';
  }
  return 'info';
});
const playerQuestions = computed(() => {
  const questions = assessment.value?.questions ?? [];
  const seen = new Set<number>();
  return questions.filter((question) => {
    if (seen.has(question.itemId)) {
      return false;
    }
    seen.add(question.itemId);
    return true;
  });
});

const answers = reactive<Record<number, { selected: string[]; text: string }>>({});
const optionOrder = reactive<Record<number, AssessmentPlayQuestionResponse['options']>>({});
const submitting = ref(false);
const error = ref('');
const resultDialog = ref(false);

let timer: ReturnType<typeof setInterval> | null = null;
const timeRemaining = ref(0);
const startedAt = ref<number | null>(null);
const draftKey = computed(() => `assessment-draft-${assessmentId.value}`);

const formattedTime = computed(() => {
  const seconds = Math.max(timeRemaining.value, 0);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
});

const progress = computed(() => {
  if (!playerQuestions.value.length) return 0;
  const answered = playerQuestions.value.filter((question) => {
    const answer = answers[question.itemId];
    if (!answer) return false;
    if (question.type === 'short') {
      return Boolean(answer.text?.trim());
    }
    return answer.selected.length > 0;
  }).length;
  return Math.round((answered / playerQuestions.value.length) * 100);
});

const currentQuestionIndex = ref(0);
const totalQuestions = computed(() => playerQuestions.value.length);
const currentQuestion = computed(
  () => playerQuestions.value[currentQuestionIndex.value] ?? null
);
const currentQuestionNumber = computed(() =>
  currentQuestion.value ? currentQuestionIndex.value + 1 : 0
);
const currentAttemptQuestion = computed(() => {
  if (!currentQuestion.value) {
    return null;
  }
  return reviewAttempt.value?.questions.find(
    (question) => question.questionVersionId === currentQuestion.value?.questionVersionId
  ) ?? null;
});
const isFirstQuestion = computed(() => currentQuestionIndex.value <= 0);
const isLastQuestion = computed(() => {
  if (!totalQuestions.value) return true;
  return currentQuestionIndex.value >= totalQuestions.value - 1;
});

const answerState = (itemId: number) => {
  if (!answers[itemId]) {
    answers[itemId] = { selected: [], text: '' };
  }
  return answers[itemId];
};

const displayOptionLabel = (option: AssessmentPlayQuestionResponse['options'][number]) =>
  option.label?.trim() || option.key;

const optionDisplayText = (
  option: AssessmentPlayQuestionResponse['options'][number] | AttemptQuestionResponse['options'][number],
  index: number
) => `${option.label?.trim() || String.fromCharCode(65 + index)}. ${option.text}`;

const isSelectedOption = (itemId: number, optionKey: string) =>
  answers[itemId]?.selected.includes(optionKey) ?? false;

const isCorrectOption = (itemId: number, optionKey: string) =>
  currentAttemptQuestion.value?.correctOptionKeys?.includes(optionKey) ?? false;

const formatOptionKeys = (
  question: AttemptQuestionResponse | null,
  keys: string[] | null | undefined
) => {
  if (!question || !keys?.length) {
    return '';
  }
  return keys
    .map((key) => {
      const index = question.options.findIndex((option) => option.key === key);
      const option = index >= 0 ? question.options[index] : null;
      return option ? optionDisplayText(option, index) : key;
    })
    .join(', ');
};

const reviewAnswerSummary = computed(() => {
  if (!currentAttemptQuestion.value) {
    return '';
  }
  if (currentAttemptQuestion.value.type === 'short') {
    return currentAttemptQuestion.value.textAnswer?.trim() || t('assessments.notSubmitted');
  }
  return formatOptionKeys(currentAttemptQuestion.value, currentAttemptQuestion.value.selectedOptionKeys);
});

const reviewCorrectAnswerSummary = computed(() => {
  if (!currentAttemptQuestion.value || currentAttemptQuestion.value.type === 'short') {
    return '';
  }
  return formatOptionKeys(currentAttemptQuestion.value, currentAttemptQuestion.value.correctOptionKeys);
});

const questionScore = (question: AttemptQuestionResponse) =>
  (Number(question.autoScore ?? 0) + Number(question.manualScore ?? 0)).toFixed(1);

const itemIdByQuestionVersionId = computed(() => {
  const map = new Map<number, number>();
  playerQuestions.value.forEach((question) => {
    map.set(question.questionVersionId, question.itemId);
  });
  return map;
});

const initializeAnswers = () => {
  if (!playerQuestions.value.length) return;
  const validIds = new Set<number>();
  playerQuestions.value.forEach((question) => {
    validIds.add(question.itemId);
    answerState(question.itemId);
    if (!optionOrder[question.itemId]) {
      optionOrder[question.itemId] = question.shuffle
        ? [...question.options].sort(() => Math.random() - 0.5)
        : question.options;
    }
  });
  Object.keys(answers).forEach((key) => {
    const numericKey = Number(key);
    if (!validIds.has(numericKey)) {
      delete answers[numericKey];
      delete optionOrder[numericKey];
    }
  });
};

const applyAttemptAnswers = (attemptQuestions: AttemptQuestionResponse[]) => {
  attemptQuestions.forEach((question) => {
    const itemId = itemIdByQuestionVersionId.value.get(question.questionVersionId);
    if (itemId == null) {
      return;
    }
    const state = answerState(itemId);
    state.selected = [...(question.selectedOptionKeys ?? [])];
    state.text = question.textAnswer ?? '';
  });
};

watch(
  () => playerQuestions.value,
  (newQuestions, oldQuestions) => {
    initializeAnswers();
    if (!newQuestions.length) {
      currentQuestionIndex.value = 0;
      return;
    }
    if (!oldQuestions?.length) {
      currentQuestionIndex.value = 0;
      return;
    }
    if (currentQuestionIndex.value >= newQuestions.length) {
      currentQuestionIndex.value = newQuestions.length - 1;
    }
  },
  { deep: true }
);

const loadDraft = () => {
  const raw = localStorage.getItem(draftKey.value);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as Record<string, { selected: string[]; text: string }>;
    Object.entries(parsed).forEach(([key, value]) => {
      answers[Number(key)] = { selected: value.selected ?? [], text: value.text ?? '' };
    });
  } catch (e) {
    console.warn('Failed to parse assessment draft', e);
  }
};

const saveDraft = () => {
  if (isReadOnly.value) {
    return;
  }
  const payload: Record<string, { selected: string[]; text: string }> = {};
  Object.entries(answers).forEach(([key, value]) => {
    payload[key] = { selected: [...value.selected], text: value.text };
  });
  localStorage.setItem(draftKey.value, JSON.stringify(payload));
};

watch(
  answers,
  () => {
    saveDraft();
  },
  { deep: true }
);

const startTimer = () => {
  if (isReadOnly.value) {
    const minutes = assessment.value?.durationMinutes ?? 0;
    timeRemaining.value = minutes * 60;
    return;
  }
  if (!assessment.value) return;
  const totalSeconds = assessment.value.durationMinutes * 60;
  if (!startedAt.value) {
    startedAt.value = Date.now();
  }
  timeRemaining.value = totalSeconds;
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    const elapsed = Math.floor((Date.now() - (startedAt.value || Date.now())) / 1000);
    timeRemaining.value = Math.max(totalSeconds - elapsed, 0);
    if (timeRemaining.value === 0 && timer) {
      clearInterval(timer);
      timer = null;
      if (!submitting.value && !isExternalForm.value) {
        void submit();
      }
    }
  }, 1000);
};

const submit = async () => {
  if (isReadOnly.value) return;
  if (!assessment.value) return;
  submitting.value = true;
  error.value = '';
  try {
    const payload = Object.entries(answers).map(([itemId, value]) => ({
      itemId: Number(itemId),
      selectedOptionKeys: value.selected,
      textAnswer: value.text || null
    }));
    const elapsedSeconds = startedAt.value ? Math.floor((Date.now() - startedAt.value) / 1000) : undefined;
    await store.submitStudentAttempt(assessmentId.value, { answers: payload, elapsedSeconds });
    localStorage.removeItem(draftKey.value);
    resultDialog.value = true;
  } catch (e) {
    console.error('Failed to submit attempt', e);
    error.value = t('assessments.submitError');
  } finally {
    submitting.value = false;
  }
};

const closeResult = () => {
  resultDialog.value = false;
};

const goBack = () => {
  router.push({ name: 'student-assessments' });
};

const scrollToTop = () => {
  if (typeof window === 'undefined') return;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const goToNextQuestion = () => {
  if (isLastQuestion.value) return;
  currentQuestionIndex.value += 1;
  scrollToTop();
};

const goToPreviousQuestion = () => {
  if (isFirstQuestion.value) return;
  currentQuestionIndex.value -= 1;
  scrollToTop();
};

const updateSingleAnswer = (itemId: number, value: string) => {
  if (isReadOnly.value) return;
  answerState(itemId).selected = value ? [value] : [];
};

const statusColor = (status: string) => {
  switch (status) {
    case 'graded':
      return 'success';
    case 'submitted':
    case 'pending_result':
      return 'warning';
    case 'in_progress':
      return 'info';
    case 'void':
      return 'danger';
    default:
      return 'info';
  }
};

const formatAttemptStatus = (status: string) => {
  switch (status) {
    case 'graded':
      return t('assessments.statusGraded');
    case 'submitted':
      return t('assessments.statusPending');
    case 'pending_result':
      return t('assessments.statusPendingResult');
    case 'in_progress':
      return t('assessments.statusInProgress');
    case 'void':
      return t('assessments.statusVoided');
    default:
      return status.toUpperCase();
  }
};

onMounted(async () => {
  try {
    await store.loadStudentAssessments();
    await store.loadStudentAssessment(assessmentId.value);
    if (!isReadOnly.value) {
      store.currentStudentAttempt = null;
    }
    initializeAnswers();
    if (isReadOnly.value) {
      const attempt = await store.loadLatestStudentAttempt(assessmentId.value);
      applyAttemptAnswers(attempt.questions);
    } else {
      loadDraft();
    }
    startTimer();
  } catch (e) {
    console.error('Failed to load assessment', e);
    error.value = t('assessments.loadError');
  }
});

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer);
  }
});
</script>

<style scoped>
.assessment-player {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-5);
}

.assessment-player__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-3);
}

.assessment-player__progress {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-3);
}

.assessment-player__progress-track {
  flex: 1;
  height: 8px;
  border-radius: var(--sakai-border-radius-pill);
  background: var(--sakai-surface-alt);
  position: relative;
  overflow: hidden;
}

.assessment-player__progress-value {
  width: var(--progress, 0%);
  height: 100%;
  background: var(--sakai-gradient-primary);
  transition: width var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.assessment-player__progress-text {
  font-size: 0.85rem;
  color: var(--sakai-text-color-tertiary);
  font-weight: var(--sakai-font-weight-medium);
}

.assessment-player__external-hint {
  margin-top: var(--sakai-space-2);
}

.assessment-player__embed {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
}

.assessment-player__embed-frame {
  width: 100%;
  min-height: 720px;
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 75%, transparent);
  border-radius: var(--sakai-border-radius-xl);
  background: var(--sakai-surface);
}

.assessment-player__questions {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-5);
}

.assessment-player__question {
  border-radius: var(--sakai-border-radius-xl);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 85%, transparent);
  background: var(--sakai-surface);
  padding: var(--sakai-space-5);
  box-shadow: var(--sakai-shadow-sm);
  transition: border-color var(--sakai-transition-duration) var(--sakai-transition-ease),
    box-shadow var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.assessment-player__question:hover {
  border-color: color-mix(in srgb, var(--sakai-primary) 25%, transparent);
  box-shadow: var(--sakai-shadow-md);
}

.assessment-player__question-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: var(--sakai-space-3);
}

.assessment-player__question-title {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-2);
  flex: 1;
}

.assessment-player__question-counter {
  font-size: 0.85rem;
  color: var(--sakai-text-color-tertiary);
  font-weight: var(--sakai-font-weight-medium);
}

.assessment-player__question-header h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
}

.assessment-player__question-body {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
  margin-top: var(--sakai-space-4);
}

.assessment-player__options {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
  margin: 0;
  padding: 0;
  border: none;
}

.assessment-player__options legend {
  display: none;
}

.assessment-player__options--inline {
  flex-direction: row;
  flex-wrap: wrap;
}

.assessment-player__option {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-3) var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 85%, transparent);
  background: var(--sakai-surface-alt);
  cursor: pointer;
  transition: border-color var(--sakai-transition-duration) var(--sakai-transition-ease),
    background var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.assessment-player__option--selected {
  border-color: color-mix(in srgb, var(--sakai-primary) 35%, transparent);
}

.assessment-player__option--correct {
  border-color: color-mix(in srgb, var(--sakai-success) 50%, transparent);
  background: color-mix(in srgb, var(--sakai-success) 10%, transparent);
}

.assessment-player__option--incorrect {
  border-color: color-mix(in srgb, var(--sakai-warning) 50%, transparent);
  background: color-mix(in srgb, var(--sakai-warning) 10%, transparent);
}

.assessment-player__option:hover,
.assessment-player__option:focus-within {
  border-color: color-mix(in srgb, var(--sakai-primary) 35%, transparent);
  background: color-mix(in srgb, var(--sakai-primary) 8%, transparent);
}

.assessment-player__option input {
  width: 1rem;
  height: 1rem;
  accent-color: var(--sakai-primary);
}

.assessment-player__option-text {
  color: var(--sakai-text-color);
  font-weight: var(--sakai-font-weight-medium);
}

.assessment-player__review {
  margin-top: var(--sakai-space-4);
  padding-top: var(--sakai-space-4);
  border-top: 1px solid color-mix(in srgb, var(--sakai-border-color) 85%, transparent);
  display: grid;
  gap: var(--sakai-space-2);
}

.assessment-player__review-line {
  margin: 0;
  color: var(--sakai-text-color-secondary);
}

.assessment-player__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--sakai-space-3);
  flex-wrap: wrap;
}

.assessment-player__actions-group {
  display: flex;
  gap: var(--sakai-space-3);
}

.assessment-player__skeleton {
  display: grid;
  gap: var(--sakai-space-4);
}

.assessment-player__skeleton-badge,
.assessment-player__skeleton-progress,
.assessment-player__skeleton-line,
.assessment-player__skeleton-card {
  position: relative;
  overflow: hidden;
  background: color-mix(in srgb, var(--sakai-border-color) 80%, transparent);
}

.assessment-player__skeleton-badge {
  width: 180px;
  height: 28px;
  border-radius: var(--sakai-border-radius-pill);
}

.assessment-player__skeleton-progress {
  height: 10px;
  border-radius: var(--sakai-border-radius-pill);
}

.assessment-player__skeleton-list {
  display: grid;
  gap: var(--sakai-space-3);
}

.assessment-player__skeleton-card {
  border-radius: var(--sakai-border-radius-xl);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 85%, transparent);
  background: var(--sakai-surface);
  padding: var(--sakai-space-5);
  display: grid;
  gap: var(--sakai-space-3);
}

.assessment-player__skeleton-line {
  height: 14px;
  border-radius: var(--sakai-border-radius-pill);
}

.assessment-player__skeleton-line--title {
  width: 70%;
}

.assessment-player__skeleton-line--short {
  width: 45%;
}

.assessment-player__skeleton-badge::after,
.assessment-player__skeleton-progress::after,
.assessment-player__skeleton-card::after,
.assessment-player__skeleton-line::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--sakai-border-color) 40%, transparent) 0%,
    color-mix(in srgb, var(--sakai-border-color) 20%, transparent) 50%,
    color-mix(in srgb, var(--sakai-border-color) 40%, transparent) 100%
  );
  animation: player-shimmer 1.4s infinite;
}

.assessment-player__result {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
  color: var(--sakai-text-color);
}

.assessment-player__result p {
  margin: 0;
  color: var(--sakai-text-color-secondary);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@keyframes player-shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
</style>
