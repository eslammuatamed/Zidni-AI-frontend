<template>
  <section class="student-ai-panel">
    <header class="student-ai-panel__header">
      <div>
        <h4>{{ t('ai.student.panelTitle') }}</h4>
        <p class="student-ai-panel__description">{{ t('ai.student.panelSubtitle') }}</p>
      </div>
      <span class="student-ai-panel__badge">{{ t('ai.common.poweredByGemini') }}</span>
    </header>

    <UiTabs v-if="hasStudentAiTools" v-model="activeTab" :tabs="tabItems" variant="pill" />
    <UiAlert v-else color="info" variant="soft">{{ t('ai.student.unavailable') }}</UiAlert>

    <div v-if="activeTab === 'tldr' && tldrEnabled" class="student-ai-panel__section">
      <UiTextarea
        v-model="baseForm.sourceMaterial"
        :rows="5"
        :label="t('ai.student.shared.sourceMaterial')"
        :placeholder="t('ai.student.shared.sourcePlaceholder')"
      />
      <div class="student-ai-panel__form-grid">
        <UiInput v-model="baseForm.lessonTitle" :label="t('ai.student.shared.lessonTitle')" />
        <UiInput
          v-model="baseForm.language"
          :label="t('ai.student.shared.language')"
          :placeholder="t('ai.common.languagePlaceholder')"
        />
        <UiTextarea
          v-model="tldrForm.focusPointsText"
          :rows="2"
          :label="t('ai.student.tldr.focusPoints')"
          :placeholder="t('ai.student.tldr.focusPointsHint')"
        />
        <UiInput
          v-model.number="tldrForm.sentenceLimit"
          type="number"
          min="1"
          max="8"
          :label="t('ai.student.tldr.sentenceLimit')"
        />
        <UiCheckbox v-model="tldrForm.includeStudyTips" :label="t('ai.student.tldr.includeTips')" />
      </div>
      <div class="student-ai-panel__actions">
        <UiButton color="primary" :disabled="tldrLoading" @click="runTldr">
          {{ tldrLoading ? t('ai.common.generating') : t('ai.student.tldr.generate') }}
        </UiButton>
      </div>
      <UiAlert v-if="tldrError" color="danger" variant="soft">{{ tldrError }}</UiAlert>
      <div v-if="tldrResult" class="student-ai-panel__result">
        <h5>{{ tldrResult.headline }}</h5>
        <p class="student-ai-panel__summary">{{ tldrResult.summary }}</p>
        <div v-if="tldrResult.highlights.length" class="student-ai-panel__list">
          <h6>{{ t('ai.student.tldr.highlightsTitle') }}</h6>
          <ul>
            <li v-for="item in tldrResult.highlights" :key="item">{{ item }}</li>
          </ul>
        </div>
        <div v-if="tldrResult.studyTips.length" class="student-ai-panel__list">
          <h6>{{ t('ai.student.tldr.studyTipsTitle') }}</h6>
          <ul>
            <li v-for="item in tldrResult.studyTips" :key="item">{{ item }}</li>
          </ul>
        </div>
      </div>
    </div>

    <div v-else-if="activeTab === 'flashcards' && flashcardsEnabled" class="student-ai-panel__section">
      <UiTextarea
        v-model="baseForm.sourceMaterial"
        :rows="5"
        :label="t('ai.student.shared.sourceMaterial')"
        :placeholder="t('ai.student.shared.sourcePlaceholder')"
      />
      <div class="student-ai-panel__form-grid">
        <UiInput v-model="baseForm.lessonTitle" :label="t('ai.student.shared.lessonTitle')" />
        <UiInput
          v-model="baseForm.language"
          :label="t('ai.student.shared.language')"
          :placeholder="t('ai.common.languagePlaceholder')"
        />
        <UiTextarea
          v-model="flashcardForm.focusTermsText"
          :rows="2"
          :label="t('ai.student.flashcards.focusTerms')"
          :placeholder="t('ai.student.flashcards.focusTermsHint')"
        />
        <UiInput
          v-model.number="flashcardForm.cardCount"
          type="number"
          min="3"
          max="12"
          :label="t('ai.student.flashcards.cardCount')"
        />
        <UiInput
          v-model="flashcardForm.difficultyHint"
          :label="t('ai.student.flashcards.difficulty')"
          :placeholder="t('ai.student.flashcards.difficultyHint')"
        />
      </div>
      <div class="student-ai-panel__actions">
        <UiButton color="primary" :disabled="flashcardLoading" @click="runFlashcards">
          {{ flashcardLoading ? t('ai.common.generating') : t('ai.student.flashcards.generate') }}
        </UiButton>
      </div>
      <UiAlert v-if="flashcardError" color="danger" variant="soft">{{ flashcardError }}</UiAlert>
      <div v-if="flashcardResult" class="student-ai-panel__result">
        <div class="student-ai-panel__cards">
          <article v-for="card in flashcardResult.cards" :key="card.front" class="student-ai-panel__card">
            <h6>{{ card.front }}</h6>
            <p>{{ card.back }}</p>
            <small v-if="card.hint">{{ t('ai.student.flashcards.hintLabel', { hint: card.hint }) }}</small>
            <small v-if="card.tag">#{{ card.tag }}</small>
          </article>
        </div>
        <UiAlert v-if="flashcardResult.studyTip" color="info" variant="soft">
          {{ flashcardResult.studyTip }}
        </UiAlert>
      </div>
    </div>

    <div v-else-if="activeTab === 'practice' && practiceEnabled" class="student-ai-panel__section">
      <UiTextarea
        v-model="baseForm.sourceMaterial"
        :rows="5"
        :label="t('ai.student.shared.sourceMaterial')"
        :placeholder="t('ai.student.shared.sourcePlaceholder')"
      />
      <div class="student-ai-panel__form-grid">
        <UiInput v-model="practiceForm.topic" :label="t('ai.student.practice.topic')" />
        <UiInput
          v-model="practiceForm.language"
          :label="t('ai.student.shared.language')"
          :placeholder="t('ai.common.languagePlaceholder')"
        />
        <UiTextarea
          v-model="practiceForm.skillsText"
          :rows="2"
          :label="t('ai.student.practice.skills')"
          :placeholder="t('ai.student.practice.skillsHint')"
        />
        <UiInput
          v-model.number="practiceForm.questionCount"
          type="number"
          min="1"
          max="10"
          :label="t('ai.student.practice.questionCount')"
        />
        <UiInput
          v-model="practiceForm.difficulty"
          :label="t('ai.student.practice.difficulty')"
          :placeholder="t('ai.student.practice.difficultyHint')"
        />
      </div>
      <div class="student-ai-panel__actions">
        <UiButton color="primary" :disabled="practiceLoading" @click="runPractice">
          {{ practiceLoading ? t('ai.common.generating') : t('ai.student.practice.generate') }}
        </UiButton>
      </div>
      <UiAlert v-if="practiceError" color="danger" variant="soft">{{ practiceError }}</UiAlert>
      <div v-if="practiceResult" class="student-ai-panel__result">
        <ol class="student-ai-panel__questions">
          <li v-for="question in practiceResult.questions" :key="question.stem">
            <h6>{{ question.stem }}</h6>
            <p class="student-ai-panel__meta">
              {{ formatQuestionMeta(question) }}
            </p>
            <ul v-if="question.options.length">
              <li v-for="option in question.options" :key="option.key">
                <strong>{{ option.key }}.</strong>
                <span>{{ option.text }}</span>
              </li>
            </ul>
            <UiAlert v-if="question.explanation" color="info" variant="soft">
              {{ question.explanation }}
            </UiAlert>
          </li>
        </ol>
        <UiAlert v-if="practiceResult.reflectionPrompt" color="secondary" variant="soft">
          {{ practiceResult.reflectionPrompt }}
        </UiAlert>
      </div>
    </div>

    <div v-else-if="feedbackEnabled" class="student-ai-panel__section">
      <UiTextarea
        v-model="feedbackForm.studentAnswer"
        :rows="4"
        :label="t('ai.student.feedback.studentAnswer')"
        :placeholder="t('ai.student.feedback.studentAnswerHint')"
      />
      <div class="student-ai-panel__form-grid">
        <UiInput v-model="feedbackForm.question" :label="t('ai.student.feedback.question')" />
        <UiInput v-model="feedbackForm.expectedAnswer" :label="t('ai.student.feedback.expectedAnswer')" />
        <UiTextarea
          v-model="feedbackForm.rubric"
          :rows="2"
          :label="t('ai.student.feedback.rubric')"
          :placeholder="t('ai.student.feedback.rubricHint')"
        />
        <UiInput v-model="feedbackForm.skillFocus" :label="t('ai.student.feedback.skillFocus')" />
        <UiInput
          v-model="feedbackForm.language"
          :label="t('ai.student.shared.language')"
          :placeholder="t('ai.common.languagePlaceholder')"
        />
      </div>
      <div class="student-ai-panel__actions">
        <UiButton color="primary" :disabled="feedbackLoading" @click="runFeedback">
          {{ feedbackLoading ? t('ai.common.generating') : t('ai.student.feedback.generate') }}
        </UiButton>
      </div>
      <UiAlert v-if="feedbackError" color="danger" variant="soft">{{ feedbackError }}</UiAlert>
      <div v-if="feedbackResult" class="student-ai-panel__result">
        <h5>{{ feedbackResult.verdict }}</h5>
        <p class="student-ai-panel__score">{{ t('ai.student.feedback.scoreLabel', { score: feedbackResult.score }) }}</p>
        <div v-if="feedbackResult.strengths.length" class="student-ai-panel__list">
          <h6>{{ t('ai.student.feedback.strengthsTitle') }}</h6>
          <ul>
            <li v-for="item in feedbackResult.strengths" :key="item">{{ item }}</li>
          </ul>
        </div>
        <div v-if="feedbackResult.improvements.length" class="student-ai-panel__list">
          <h6>{{ t('ai.student.feedback.improvementsTitle') }}</h6>
          <ul>
            <li v-for="item in feedbackResult.improvements" :key="item">{{ item }}</li>
          </ul>
        </div>
        <UiAlert v-if="feedbackResult.nextSteps" color="info" variant="soft">
          {{ feedbackResult.nextSteps }}
        </UiAlert>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import axios from 'axios';
import { useI18n } from 'vue-i18n';
import { FEATURE } from '@/constants/featureCatalog';
import UiTabs from '@/components/ui/UiTabs.vue';
import UiTextarea from '@/components/ui/UiTextarea.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiCheckbox from '@/components/ui/UiCheckbox.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import { useFeaturesStore } from '@/stores/features';
import {
  generateStudentTldr,
  generateStudentFlashcards,
  generateStudentPracticeQuestions,
  requestStudentAnswerFeedback,
  type StudentTldrResult,
  type StudentFlashcardResult,
  type StudentPracticeQuestionResult,
  type StudentAnswerFeedbackResult,
  type GeneratedQuestion
} from '@/services/ai';

type TabKey = 'tldr' | 'flashcards' | 'practice' | 'feedback';

const props = defineProps<{
  lessonTitle: string;
  initialSource?: string;
}>();

const { t } = useI18n();

const featuresStore = useFeaturesStore();

const tldrEnabled = computed(() => featuresStore.hasFeature(FEATURE.studentTldr));
const flashcardsEnabled = computed(() => featuresStore.hasFeature(FEATURE.studentFlashcards));
const practiceEnabled = computed(() => featuresStore.hasFeature(FEATURE.studentPracticeQuestions));
const feedbackEnabled = computed(() => featuresStore.hasFeature(FEATURE.studentInstantFeedback));

const activeTab = ref<TabKey>('tldr');

const tabItems = computed(() => {
  const items: Array<{ value: TabKey; label: string }> = [];
  if (tldrEnabled.value) {
    items.push({ value: 'tldr', label: t('ai.student.tabs.tldr') });
  }
  if (flashcardsEnabled.value) {
    items.push({ value: 'flashcards', label: t('ai.student.tabs.flashcards') });
  }
  if (practiceEnabled.value) {
    items.push({ value: 'practice', label: t('ai.student.tabs.practice') });
  }
  if (feedbackEnabled.value) {
    items.push({ value: 'feedback', label: t('ai.student.tabs.feedback') });
  }
  return items;
});

const hasStudentAiTools = computed(() => tabItems.value.length > 0);

watch(
  tabItems,
  (items) => {
    if (!items.some((item) => item.value === activeTab.value)) {
      activeTab.value = items[0]?.value ?? 'tldr';
    }
  },
  { immediate: true }
);

const baseForm = reactive({
  lessonTitle: '',
  sourceMaterial: '',
  language: ''
});

const lastInitialSource = ref('');

const tldrForm = reactive({
  focusPointsText: '',
  includeStudyTips: true,
  sentenceLimit: 4
});

const flashcardForm = reactive({
  focusTermsText: '',
  cardCount: 6,
  difficultyHint: ''
});

const practiceForm = reactive({
  topic: '',
  skillsText: '',
  questionCount: 3,
  difficulty: '',
  language: ''
});

const feedbackForm = reactive({
  question: '',
  studentAnswer: '',
  expectedAnswer: '',
  rubric: '',
  skillFocus: '',
  language: ''
});

const tldrState = reactive<{ loading: boolean; error: string; result: StudentTldrResult | null }>({
  loading: false,
  error: '',
  result: null
});

const flashcardState = reactive<{ loading: boolean; error: string; result: StudentFlashcardResult | null }>({
  loading: false,
  error: '',
  result: null
});

const practiceState = reactive<{ loading: boolean; error: string; result: StudentPracticeQuestionResult | null }>({
  loading: false,
  error: '',
  result: null
});

const feedbackState = reactive<{ loading: boolean; error: string; result: StudentAnswerFeedbackResult | null }>({
  loading: false,
  error: '',
  result: null
});

watch(
  () => props.lessonTitle,
  (title) => {
    baseForm.lessonTitle = title ?? '';
    if (!practiceForm.topic) {
      practiceForm.topic = title ?? '';
    }
  },
  { immediate: true }
);

watch(
  () => props.initialSource,
  (value) => {
    const incoming = value ?? '';
    const shouldUpdate =
      !baseForm.sourceMaterial || baseForm.sourceMaterial === lastInitialSource.value;
    if (shouldUpdate) {
      baseForm.sourceMaterial = incoming;
    }
    lastInitialSource.value = incoming;
  },
  { immediate: true }
);

const tldrResult = computed(() => tldrState.result);
const tldrError = computed(() => tldrState.error);
const tldrLoading = computed(() => tldrState.loading);

const flashcardResult = computed(() => flashcardState.result);
const flashcardError = computed(() => flashcardState.error);
const flashcardLoading = computed(() => flashcardState.loading);

const practiceResult = computed(() => practiceState.result);
const practiceError = computed(() => practiceState.error);
const practiceLoading = computed(() => practiceState.loading);

const feedbackResult = computed(() => feedbackState.result);
const feedbackError = computed(() => feedbackState.error);
const feedbackLoading = computed(() => feedbackState.loading);

async function runTldr() {
  if (!tldrEnabled.value) {
    tldrState.error = t('ai.common.forbidden');
    return;
  }
  tldrState.loading = true;
  tldrState.error = '';
  try {
    tldrState.result = await generateStudentTldr({
      lessonTitle: baseForm.lessonTitle || props.lessonTitle,
      sourceMaterial: baseForm.sourceMaterial,
      focusPoints: tokenizeList(tldrForm.focusPointsText),
      includeStudyTips: tldrForm.includeStudyTips,
      sentenceLimit: Number.isFinite(tldrForm.sentenceLimit) ? tldrForm.sentenceLimit : undefined,
      language: baseForm.language || undefined
    });
  } catch (error) {
    tldrState.error = resolveError(error);
  } finally {
    tldrState.loading = false;
  }
}

async function runFlashcards() {
  if (!flashcardsEnabled.value) {
    flashcardState.error = t('ai.common.forbidden');
    return;
  }
  flashcardState.loading = true;
  flashcardState.error = '';
  try {
    flashcardState.result = await generateStudentFlashcards({
      lessonTitle: baseForm.lessonTitle || props.lessonTitle,
      sourceMaterial: baseForm.sourceMaterial,
      focusTerms: tokenizeList(flashcardForm.focusTermsText),
      cardCount: Number.isFinite(flashcardForm.cardCount) ? flashcardForm.cardCount : undefined,
      difficultyHint: flashcardForm.difficultyHint || undefined,
      language: baseForm.language || undefined
    });
  } catch (error) {
    flashcardState.error = resolveError(error);
  } finally {
    flashcardState.loading = false;
  }
}

async function runPractice() {
  if (!practiceEnabled.value) {
    practiceState.error = t('ai.common.forbidden');
    return;
  }
  practiceState.loading = true;
  practiceState.error = '';
  try {
    practiceState.result = await generateStudentPracticeQuestions({
      topic: practiceForm.topic || baseForm.lessonTitle || props.lessonTitle,
      sourceMaterial: baseForm.sourceMaterial,
      skills: tokenizeList(practiceForm.skillsText),
      questionCount: Number.isFinite(practiceForm.questionCount) ? practiceForm.questionCount : undefined,
      difficulty: practiceForm.difficulty || undefined,
      language: practiceForm.language || baseForm.language || undefined
    });
  } catch (error) {
    practiceState.error = resolveError(error);
  } finally {
    practiceState.loading = false;
  }
}

async function runFeedback() {
  if (!feedbackEnabled.value) {
    feedbackState.error = t('ai.common.forbidden');
    return;
  }
  feedbackState.loading = true;
  feedbackState.error = '';
  try {
    feedbackState.result = await requestStudentAnswerFeedback({
      question: feedbackForm.question || '',
      studentAnswer: feedbackForm.studentAnswer,
      expectedAnswer: feedbackForm.expectedAnswer || undefined,
      rubric: feedbackForm.rubric || undefined,
      skillFocus: feedbackForm.skillFocus || undefined,
      language: feedbackForm.language || baseForm.language || undefined
    });
  } catch (error) {
    feedbackState.error = resolveError(error);
  } finally {
    feedbackState.loading = false;
  }
}

function tokenizeList(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function formatQuestionMeta(question: GeneratedQuestion) {
  const parts: string[] = [];
  if (question.difficulty) {
    parts.push(t('ai.student.practice.difficultyLabel', { difficulty: question.difficulty }));
  }
  if (question.type) {
    parts.push(t('ai.student.practice.typeLabel', { type: normalizeQuestionType(question.type) }));
  }
  if (question.answerKey) {
    parts.push(t('ai.student.practice.answerKeyLabel', { answer: question.answerKey }));
  }
  return parts.join(' · ');
}

function normalizeQuestionType(type: string) {
  switch (type.toUpperCase()) {
    case 'MCQ_SINGLE':
      return t('ai.student.practice.typeSingle');
    case 'MCQ_MULTI':
      return t('ai.student.practice.typeMulti');
    case 'TRUEFALSE':
      return t('ai.student.practice.typeTrueFalse');
    case 'SHORT':
      return t('ai.student.practice.typeShort');
    default:
      return type;
  }
}

function resolveError(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 429) {
      return t('ai.common.limitReached');
    }
    if (error.response?.status === 403) {
      return t('ai.common.forbidden');
    }
    if (error.response?.status === 400) {
      return t('ai.common.invalidRequest');
    }
  }
  return t('ai.common.genericError');
}
</script>

<style scoped>
.student-ai-panel {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-5);
}

.student-ai-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--sakai-space-4);
}

.student-ai-panel__description {
  margin: 0;
  color: var(--sakai-text-color-secondary);
  font-size: var(--sakai-font-size-sm);
}

.student-ai-panel__badge {
  display: inline-flex;
  align-items: center;
  gap: var(--sakai-space-2);
  padding: 0.35rem 0.75rem;
  border-radius: var(--sakai-border-radius-pill);
  background: color-mix(in srgb, var(--sakai-primary) 10%, transparent);
  color: var(--sakai-primary-700);
  font-size: var(--sakai-font-size-sm);
  white-space: nowrap;
}

.student-ai-panel__section {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  border: 1px solid color-mix(in srgb, var(--sakai-primary) 8%, var(--sakai-border-color));
  background: color-mix(in srgb, var(--sakai-primary) 4%, var(--sakai-surface-100));
}

.student-ai-panel__form-grid {
  display: grid;
  gap: var(--sakai-space-3);
}

.student-ai-panel__actions {
  display: flex;
  justify-content: flex-end;
}

.student-ai-panel__result {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-3);
  border-radius: var(--sakai-border-radius-md);
  background: var(--sakai-surface);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 60%, transparent);
}

.student-ai-panel__summary {
  margin: 0;
  line-height: var(--sakai-line-height-lg);
}

.student-ai-panel__list ul {
  margin: 0;
  padding-left: var(--sakai-space-5);
  display: grid;
  gap: var(--sakai-space-2);
}

.student-ai-panel__cards {
  display: grid;
  gap: var(--sakai-space-3);
}

.student-ai-panel__card {
  padding: var(--sakai-space-3);
  border-radius: var(--sakai-border-radius-md);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 55%, transparent);
  background: var(--sakai-surface-100);
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-2);
}

.student-ai-panel__questions {
  margin: 0;
  padding-left: var(--sakai-space-5);
  display: grid;
  gap: var(--sakai-space-3);
}

.student-ai-panel__questions ul {
  margin-top: var(--sakai-space-2);
  padding-left: var(--sakai-space-4);
  display: grid;
  gap: var(--sakai-space-2);
}

.student-ai-panel__meta {
  margin: 0;
  color: var(--sakai-text-color-secondary);
}

.student-ai-panel__score {
  margin: 0;
  font-weight: var(--sakai-font-weight-semibold);
}

@media (min-width: 768px) {
  .student-ai-panel__form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 960px) {
  .student-ai-panel__cards {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
}
</style>
