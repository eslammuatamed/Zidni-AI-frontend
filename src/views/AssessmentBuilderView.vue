<template>
   <ThemePage
 
    :title="assessment?.title || ''"
    :subtitle="assessment ? t('assessments.builderSubtitle', { course: assessment.courseTitle }) : ''"
    :badge="assessment ? assessment.type.toUpperCase() : ''"
  >
    <template #actions>
      <UiButton variant="link" color="secondary" prepend-icon="ArrowLeftOutlined" @click="goBack">
        {{ t('assessments.backToList') }}
      </UiButton>
      <UiButton variant="outline" color="primary" prepend-icon="TeamOutlined" @click="goToAttempts">
        {{ t('assessments.manageAttempts') }}
      </UiButton>
    </template>

    <div class="assessment-builder">
      <UiCard
        class="assessment-builder__structure"
        :title="t('assessments.assessmentName')"
        :subtitle="assessment ? t('assessments.builderSubtitle', { course: assessment.courseTitle }) : ''"
      >
        <div v-if="assessment" class="assessment-builder__form">
          <UiInput v-model="builderForm.title" :label="t('assessments.assessmentName')" />
          <div class="assessment-builder__form-row">
            <UiSelect
              :model-value="builderForm.type"
              :label="t('assessments.mode')"
              @update:model-value="(value) => (builderForm.type = String(value ?? ''))"
            >
              <option v-for="option in assessmentTypes" :key="option.value" :value="option.value">
                {{ option.title }}
              </option>
            </UiSelect>
            <UiInput
              :model-value="builderForm.durationMinutes"
              type="number"
              min="1"
              :label="t('assessments.duration')"
              @update:model-value="(value) => (builderForm.durationMinutes = Number(value ?? 0))"
            />
          </div>
          <div class="assessment-builder__form-row">
            <UiInput
              :model-value="builderForm.maxAttempts"
              type="number"
              min="1"
              :label="t('assessments.maxAttempts')"
              @update:model-value="(value) => (builderForm.maxAttempts = Math.max(1, Number(value ?? 1)))"
            />
            <UiCheckbox
              v-model="builderForm.revealAnswersAfterGrading"
              :label="t('assessments.revealAnswersAfterGrading')"
            />
          </div>
          <UiInput
            v-if="isExternalForm"
            v-model="builderForm.embedUrl"
            :label="t('assessments.embedUrlLabel')"
            :placeholder="'https://docs.google.com/forms/d/e/.../viewform?embedded=true'"
            :helper-text="t('assessments.embedUrlHint')"
          />
          <UiAlert v-if="isExternalForm" variant="outline" color="primary" class="assessment-builder__embed-guide">
            <p class="assessment-builder__embed-title">{{ t('assessments.embedHowToTitle') }}</p>
            <ol class="assessment-builder__embed-steps">
              <li>{{ t('assessments.embedHowToStep1') }}</li>
              <li>{{ t('assessments.embedHowToStep2') }}</li>
              <li>{{ t('assessments.embedHowToStep3') }}</li>
            </ol>
          </UiAlert>
        </div>
        <div v-else class="assessment-builder__skeleton">
          <div class="builder-skeleton__line builder-skeleton__line--title"></div>
          <div class="builder-skeleton__grid">
            <div class="builder-skeleton__field"></div>
            <div class="builder-skeleton__field"></div>
            <div class="builder-skeleton__field"></div>
          </div>
        </div>

        <UiAlert v-if="assessment && !isExternalForm" class="assessment-builder__hint" color="info">
          {{ t('assessments.builderHint') }}
        </UiAlert>
        <UiAlert v-else-if="assessment && isExternalForm" class="assessment-builder__hint" color="info" variant="soft">
          {{ t('assessments.externalFormHelper') }}
        </UiAlert>

        <div v-if="assessment && !isExternalForm" class="assessment-builder__items">
          <div
            v-for="(item, index) in assessment.items"
            :key="item.id"
            class="builder-item"
            :class="{ 'builder-item--dragging': draggingIndex === index }"
            draggable="true"
            @dragstart="onDragStart(index)"
            @dragover.prevent
            @drop="onDrop(index)"
            @dragend="resetDrag"
          >
            <div class="builder-item__header">
              <div class="builder-item__title">
                <span class="builder-item__index">{{ index + 1 }}.</span>
                <span>{{ item.stem }}</span>
 
              </div>
              <div class="builder-item__actions">
                <button
                  class="builder-item__action"
                  type="button"
                  :disabled="index === 0"
                  @click="reorderItem(item, index - 1)"
                  aria-label="Move question up"
                >
                  <UiIcon name="ArrowUpOutlined" :size="16" />
                </button>
                <button
                  class="builder-item__action"
                  type="button"
                  :disabled="index === assessment.items.length - 1"
                  @click="reorderItem(item, index + 1)"
                  aria-label="Move question down"
                >
                  <UiIcon name="ArrowDownOutlined" :size="16" />
                </button>
                <button class="builder-item__action builder-item__action--danger" type="button" @click="removeItem(item)"
                  aria-label="Remove question"
                >
                  <UiIcon name="CloseOutlined" :size="16" />
                </button>
              </div>
            </div>
            <div class="builder-item__body">
              <UiInput
                class="builder-item__points"
                :model-value="itemPoints[item.id]"
                type="number"
                min="0"
                :label="t('assessments.points')"
                @update:model-value="(value) => {
                  itemPoints[item.id] = Number(value ?? 0);
                  queuePointsSave(item);
                }"
              />
              <div class="builder-item__options">
                <span
                  v-for="option in item.options"
                  :key="option.id"
                  class="builder-item__option"
                  :class="{ 'builder-item__option--correct': option.correct }"
                >
                  {{ option.label }}. {{ option.text }}
                </span>
              </div>
            </div>
          </div>
          <div
            class="builder-dropzone"
            role="button"
            tabindex="0"
            @dragover.prevent
            @drop="onDrop(assessment.items.length)"
            @dragend="resetDrag"
          >
            <span class="builder-dropzone__icon">+</span>
            {{ t('assessments.dropHere') }}
          </div>
          <UiAlert v-if="!assessment.items.length" class="assessment-builder__empty" variant="outline" color="info">
            {{ t('assessments.noQuestionsYet') }}
          </UiAlert>
        </div>
        <div v-else-if="assessment" class="assessment-builder__empty-embed">
          <UiAlert variant="soft" color="info">
            {{ t('assessments.embedUrlHint') }}
          </UiAlert>
        </div>
        <div v-else class="builder-skeleton__list">
          <div v-for="index in 3" :key="`skeleton-item-${index}`" class="builder-skeleton__item">
            <div class="builder-skeleton__line builder-skeleton__line--wide"></div>
            <div class="builder-skeleton__line"></div>
          </div>
        </div>
      </UiCard>

      <UiCard class="assessment-builder__attempts" :title="t('assessments.attemptsHeading')">
        <UiAlert v-if="!store.attempts.length" variant="soft" color="info">
          {{ t('assessments.noAttempts') }}
        </UiAlert>
        <ul v-else class="assessment-builder__attempts-list">
          <li v-for="attempt in store.attempts" :key="attempt.id">
            <button type="button" class="assessment-builder__attempt" @click="openAttempt(attempt.id)">
              <div class="assessment-builder__attempt-text">
                <p class="assessment-builder__attempt-name">{{ attempt.studentName }}</p>
                <p class="assessment-builder__attempt-meta">{{ formatAttemptSubtitle(attempt) }}</p>
              </div>
              <UiBadge :color="statusColor(attempt.status)">
                {{ attempt.status.toUpperCase() }}
              </UiBadge>
            </button>
          </li>
        </ul>
      </UiCard>
    </div>

    <template #sidebar>
      <UiCard v-if="!isExternalForm" class="assessment-builder__add" :title="t('assessments.addFromBank')">
        <UiSelect
          :model-value="addForm.bankId ?? ''"
          :label="t('assessments.banks')"
          @update:model-value="(value) => {
            const parsed = value === '' ? null : Number(value);
            onBankChange(parsed);
          }"
        >
          <option value="" disabled>{{ t('assessments.banks') }}</option>
          <option v-for="bank in bankOptions" :key="bank.id" :value="bank.id">
            {{ bank.name }}
          </option>
        </UiSelect>
        <UiSelect
          :model-value="addForm.questionId ?? ''"
          :label="t('assessments.selectQuestion')"
          :disabled="!addForm.bankId"
          @update:model-value="(value) => {
            const parsed = value === '' ? null : Number(value);
            onQuestionChange(parsed);
          }"
        >
          <option value="" disabled>{{ t('assessments.selectQuestion') }}</option>
          <option v-for="option in questionOptions" :key="option.id" :value="option.id">
            {{ option.label }}
          </option>
        </UiSelect>
        <UiSelect
          v-if="versionOptions.length > 1"
          :model-value="addForm.questionVersionId ?? ''"
          :label="t('assessments.selectVersion')"
          @update:model-value="(value) => {
            addForm.questionVersionId = value === '' ? null : Number(value);
          }"
        >
          <option value="" disabled>{{ t('assessments.selectVersion') }}</option>
          <option v-for="option in versionOptions" :key="option.id" :value="option.id">
            {{ option.label }}
          </option>
        </UiSelect>
        <UiInput
          :model-value="addForm.points ?? ''"
          type="number"
          min="0"
          :label="t('assessments.pointsOverride')"
          @update:model-value="(value) => (addForm.points = value === '' ? null : Number(value))"
        />
        <UiInput v-model="addForm.poolKey" :label="t('assessments.poolKey')" />
        <UiButton color="primary" :disabled="!canAddQuestion" @click="addQuestionToAssessment">
          {{ t('assessments.addToAssessment') }}
        </UiButton>
      </UiCard>

      <UiCard v-else class="assessment-builder__add" :title="t('assessments.addFromBank')">
        <UiAlert variant="soft" color="info">
          {{ t('assessments.externalFormHelper') }}
        </UiAlert>
      </UiCard>

      <UiCard class="assessment-builder__stats" :title="t('assessments.quickStats')">
        <dl class="assessment-builder__stats-grid">
          <div>
            <dt>{{ t('assessments.totalQuestions') }}</dt>
            <dd>{{ isExternalForm ? 0 : assessment?.items.length ?? 0 }}</dd>
          </div>
          <div>
            <dt>{{ t('assessments.totalPoints') }}</dt>
            <dd>{{ isExternalForm ? 0 : assessment?.maxScore ?? 0 }}</dd>
          </div>
        </dl>
      </UiCard>
    </template>

    <UiDialog
      v-model="attemptDialog"
      :title="currentAttempt ? t('assessments.overrideTitle', { name: currentAttempt.studentName }) : ''"
      width="720px"
    >
      <template v-if="currentAttempt">
        <div class="assessment-builder__attempt-status">
          <UiBadge :color="statusColor(currentAttempt.status)">
            {{ currentAttempt.status.toUpperCase() }}
          </UiBadge>
        </div>
        <UiAlert v-if="attemptForm.error" variant="outline" color="danger">
          {{ attemptForm.error }}
        </UiAlert>
        <div class="assessment-builder__attempt-grid">
          <div>
            <span class="assessment-builder__attempt-label">{{ t('assessments.submittedAt') }}</span>
            <span class="assessment-builder__attempt-value">
              {{
                currentAttempt.submittedAt
                  ? new Date(currentAttempt.submittedAt).toLocaleString()
                  : t('assessments.notSubmitted')
              }}
            </span>
          </div>
          <UiInput
            :model-value="attemptForm.manualScore ?? ''"
            type="number"
            min="0"
            :label="t('assessments.overrideManualTotal')"
            readonly
            disabled
          />
        </div>
        <div class="assessment-builder__attempt-questions">
          <details
            v-for="question in attemptForm.questions"
            :key="question.id"
            class="assessment-builder__attempt-question"
          >
            <summary>
              <div class="assessment-builder__attempt-summary">
                <span>{{ question.position }}. {{ question.stem }}</span>
                <span class="assessment-builder__attempt-scores">
                  {{ t('assessments.questionAuto') }}: {{ question.autoScore }}
                </span>
              </div>
            </summary>
            <div class="assessment-builder__attempt-fields">
              <UiInput
                :model-value="question.manualScore ?? ''"
                type="number"
                min="0"
                :label="t('assessments.questionManual')"
                @update:model-value="(value) => { question.manualScore = value === '' ? 0 : Number(value); recalcManualTotal(); }"
              />
              <UiTextarea v-model="question.feedback" :label="t('assessments.feedbackLabel')" :rows="3" />
              <div
                v-if="selectedAttemptQuestion(question.id)?.selectedOptionKeys?.length"
                class="assessment-builder__attempt-extra"
              >
                <span class="assessment-builder__attempt-label">{{ t('assessments.selectedOptions') }}</span>
                <span class="assessment-builder__attempt-value">
                  {{ selectedAttemptQuestion(question.id)?.selectedOptionKeys?.join(', ') }}
                </span>
              </div>
              <div
                v-if="selectedAttemptQuestion(question.id)?.textAnswer"
                class="assessment-builder__attempt-extra"
              >
                <span class="assessment-builder__attempt-label">{{ t('assessments.textAnswer') }}</span>
                <span class="assessment-builder__attempt-value">
                  {{ selectedAttemptQuestion(question.id)?.textAnswer }}
                </span>
              </div>
            </div>
          </details>
        </div>
      </template>
      <template #footer>
        <UiButton variant="link" color="secondary" @click="closeAttemptDialog">
          {{ t('common.cancel') }}
        </UiButton>
        <UiButton color="primary" :disabled="attemptForm.loading" @click="saveAttemptOverride">
          {{ t('assessments.saveOverride') }}
         </UiButton>
 
      </template>
    </UiDialog>

    <UiToast
      :visible="saveToast.visible"
      type="success"
      :message="saveToast.message"
      @close="saveToast.visible = false"
    />
 
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAssessmentsStore } from '@/stores/assessments';
import type {
  AssessmentItemResponse,
  AssessmentAttemptSummary,
  AssessmentAttemptResponse,
  AttemptQuestionResponse,
  QuestionDetailResponse
} from '@/services/assessments';
import { useI18n } from 'vue-i18n';
import UiDialog from '@/components/ui/UiDialog.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiTextarea from '@/components/ui/UiTextarea.vue';
import UiToast from '@/components/ui/UiToast.vue';
import UiCheckbox from '@/components/ui/UiCheckbox.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const store = useAssessmentsStore();

const assessmentId = computed(() => Number(route.params.assessmentId));
const assessment = computed(() => store.currentAssessment);
const currentAttempt = computed(() => store.currentAttempt);
const stemByQuestionId = computed(() => {
  const map = new Map<number, string>();
  const items = assessment.value?.items ?? [];
  items.forEach((item) => {
    map.set(item.questionId, item.stem);
  });
  return map;
});

const builderForm = reactive({
  title: '',
  durationMinutes: 0,
  type: 'quiz',
  embedUrl: '',
  maxAttempts: 1,
  revealAnswersAfterGrading: true
});

const isExternalForm = computed(() => builderForm.type === 'external_form');

const addForm = reactive({
  bankId: null as number | null,
  questionId: null as number | null,
  questionVersionId: null as number | null,
  points: null as number | null,
  poolKey: ''
});

const saveToast = reactive({
  visible: false,
  message: ''
});
let toastTimeout: ReturnType<typeof setTimeout> | null = null;

const attemptDialog = ref(false);
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
      stem:
        stemByQuestionId.value.get(question.questionId) ||
        t('assessments.questionFallback', { position: question.position }),
      autoScore: Number(question.autoScore ?? 0),
      manualScore: Number(question.manualScore ?? 0),
      feedback: question.feedback ?? ''
    }));
};

const assessmentTypes = computed(() => [
  { title: t('assessments.type.quiz'), value: 'quiz' },
  { title: t('assessments.type.exam'), value: 'exam' },
  { title: t('assessments.type.external_form'), value: 'external_form' }
]);

const bankOptions = computed(() => store.banks.map((bank) => ({ id: bank.id, name: bank.name })));
const questionOptions = computed(() => {
  if (!store.currentBank) return [];
  return store.currentBank.questions
    .filter((question) => question.currentVersion)
    .map((question) => ({
    id: question.id,
    label: question.currentVersion!.stem,
    detail: question
  }));
});

const versionOptions = computed(() => {
  const question = selectedQuestion.value;
  if (!question) return [];
  return question.history.map((version) => ({
    id: version.id,
    label: new Date(version.createdAt).toLocaleString()
  }));
});

const selectedQuestion = computed<QuestionDetailResponse | null>(() => {
  if (!store.currentBank || addForm.questionId == null) return null;
  return store.currentBank.questions.find((q) => q.id === addForm.questionId) ?? null;
});

const canAddQuestion = computed(() => Boolean(addForm.bankId && addForm.questionId && selectedQuestion.value?.currentVersion));

let updateTimer: ReturnType<typeof setTimeout> | undefined;
let suppressWatch = false;
const pendingPointUpdates = new Map<number, ReturnType<typeof setTimeout>>();

const itemPoints = reactive<Record<number, number>>({});

const populateForm = () => {
  if (!assessment.value) return;
  suppressWatch = true;
  builderForm.title = assessment.value.title;
  builderForm.durationMinutes = assessment.value.durationMinutes;
  builderForm.type = assessment.value.type;
  builderForm.embedUrl = assessment.value.embedUrl || '';
  builderForm.maxAttempts = assessment.value.maxAttempts;
  builderForm.revealAnswersAfterGrading = assessment.value.revealAnswersAfterGrading;
  itemPointsReset();
  suppressWatch = false;
};

const itemPointsReset = () => {
  if (!assessment.value) return;
  Object.keys(itemPoints).forEach((key) => delete itemPoints[Number(key)]);
  assessment.value.items.forEach((item) => {
    itemPoints[item.id] = Number(item.points ?? 0);
  });
};

watch(assessment, () => populateForm(), { immediate: true });

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

watch(
  () => attemptDialog.value,
  (open) => {
    if (!open) {
      attemptForm.error = '';
    }
  }
);

watch(
  () => ({ ...builderForm }),
  async () => {
    if (suppressWatch || !assessment.value) return;
    if (updateTimer) clearTimeout(updateTimer);
    updateTimer = window.setTimeout(async () => {
      try {
        await store.updateAssessment(assessmentId.value, {
          title: builderForm.title,
          durationMinutes: builderForm.durationMinutes,
          type: builderForm.type,
          embedUrl: builderForm.embedUrl,
          maxAttempts: builderForm.maxAttempts,
          revealAnswersAfterGrading: builderForm.revealAnswersAfterGrading
        });
        showSaved(t('assessments.autosaveUpdated'));
      } catch (error) {
        console.error('Failed to update assessment', error);
      }
    }, 500);
  },
  { deep: true }
);

const onBankChange = async (bankId: number | null) => {
  addForm.bankId = bankId;
  if (bankId == null) {
    addForm.questionId = null;
    addForm.questionVersionId = null;
    return;
  }
  await store.loadBank(bankId);
  addForm.questionId = null;
  addForm.questionVersionId = null;
};

const onQuestionChange = (questionId: number | null) => {
  addForm.questionId = questionId;
  if (!questionId) {
    addForm.questionVersionId = null;
    addForm.points = null;
    return;
  }
  const question = selectedQuestion.value;
  if (question?.currentVersion) {
    addForm.questionVersionId = question.currentVersion.id;
    addForm.points = Number(question.currentVersion.points ?? 0);
  } else {
    addForm.questionVersionId = null;
    addForm.points = null;
  }
};

const addQuestionToAssessment = async () => {
  if (!canAddQuestion.value || !assessment.value || addForm.bankId == null || addForm.questionId == null) {
    return;
  }
  try {
    await store.addAssessmentItem(assessmentId.value, {
      questionId: addForm.questionId,
      questionVersionId: addForm.questionVersionId,
      points: addForm.points,
      poolKey: addForm.poolKey ? addForm.poolKey : null,
      position: assessment.value.items.length + 1
    });
    showSaved(t('assessments.itemAdded'));
    addForm.questionId = null;
    addForm.questionVersionId = null;
    addForm.points = null;
    addForm.poolKey = '';
  } catch (error) {
    console.error('Failed to add question', error);
  }
};

const queuePointsSave = (item: AssessmentItemResponse) => {
  const timeout = pendingPointUpdates.get(item.id);
  if (timeout) clearTimeout(timeout);
  const newTimeout = window.setTimeout(async () => {
    try {
      await store.updateAssessmentItem(assessmentId.value, item.id, {
        points: itemPoints[item.id]
      });
      showSaved(t('assessments.autosaveUpdated'));
    } catch (error) {
      console.error('Failed to update points', error);
    }
  }, 400);
  pendingPointUpdates.set(item.id, newTimeout);
};

const reorderItem = async (item: AssessmentItemResponse, targetIndex: number) => {
  if (!assessment.value) return;
  const newPosition = targetIndex + 1;
  try {
    await store.updateAssessmentItem(assessmentId.value, item.id, { position: newPosition });
    showSaved(t('assessments.autosaveUpdated'));
  } catch (error) {
    console.error('Failed to reorder', error);
  }
};

const removeItem = async (item: AssessmentItemResponse) => {
  try {
    await store.deleteAssessmentItem(assessmentId.value, item.id);
    showSaved(t('assessments.itemRemoved'));
  } catch (error) {
    console.error('Failed to delete item', error);
  }
};

const draggingIndex = ref<number | null>(null);
const onDragStart = (index: number) => {
  draggingIndex.value = index;
};

const onDrop = async (index: number) => {
  if (draggingIndex.value === null || !assessment.value) return;
  const items = assessment.value.items;
  const draggedItem = items[draggingIndex.value];
  let newPosition = Math.min(index + 1, items.length);
  if (index >= items.length) {
    newPosition = items.length;
  }
  if (newPosition <= 0) {
    newPosition = 1;
  }
  if (newPosition === draggedItem.position) {
    draggingIndex.value = null;
    return;
  }
  try {
    await store.updateAssessmentItem(assessmentId.value, draggedItem.id, { position: newPosition });
    showSaved(t('assessments.autosaveUpdated'));
  } catch (error) {
    console.error('Failed to reorder via drag', error);
  } finally {
    draggingIndex.value = null;
  }
};

const resetDrag = () => {
  draggingIndex.value = null;
};

const showSaved = (message: string) => {
  saveToast.message = message;
  saveToast.visible = true;
  if (toastTimeout) {
    clearTimeout(toastTimeout);
    toastTimeout = null;
  }
  toastTimeout = window.setTimeout(() => {
    saveToast.visible = false;
    toastTimeout = null;
  }, 2500);
};

const openAttempt = async (attemptId: number) => {
  try {
    await store.loadAttemptDetail(assessmentId.value, attemptId);
    attemptDialog.value = true;
  } catch (error) {
    console.error('Failed to load attempt detail', error);
  }
};

const selectedAttemptQuestion = (attemptQuestionId: number): AttemptQuestionResponse | undefined => {
  return currentAttempt.value?.questions.find((question) => question.id === attemptQuestionId);
};

const formatAttemptSubtitle = (attempt: AssessmentAttemptSummary) => {
  const submitted = attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : t('assessments.notSubmitted');
  return `${submitted} · ${t('assessments.scoreSummary', {
    auto: attempt.autoScore ?? 0,
    manual: attempt.manualScore ?? 0
  })}`;
};

const statusColor = (status: string) => {
  switch (status) {
    case 'graded':
      return 'success';
    case 'submitted':
      return 'warning';
    case 'in_progress':
      return 'info';
    case 'void':
      return 'danger';
    default:
      return 'info';
  }
};

const saveAttemptOverride = async () => {
  if (!currentAttempt.value) return;
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
    showSaved(t('assessments.overrideSaved'));
    attemptDialog.value = false;
  } catch (error) {
    attemptForm.error = t('assessments.overrideError');
    console.error('Failed to override attempt', error);
  } finally {
    attemptForm.loading = false;
  }
};

const closeAttemptDialog = () => {
  attemptDialog.value = false;
  store.currentAttempt = null;
};

const goToAttempts = () => {
  router.push({
    name: 'teacher-assessment-attempts',
    params: { assessmentId: assessmentId.value }
  });
};

const goBack = () => {
  router.push({ name: 'teacher-assessments' });
};

onMounted(async () => {
  try {
    await Promise.all([
      store.loadAssessment(assessmentId.value),
      store.loadBanks(),
      store.loadAttempts(assessmentId.value)
    ]);
  } catch (error) {
    console.error('Failed to load assessment builder data', error);
  }
});

onBeforeUnmount(() => {
  if (updateTimer) clearTimeout(updateTimer);
  pendingPointUpdates.forEach((timeout) => clearTimeout(timeout));
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }
});
</script>

<style scoped>
.assessment-builder {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-6);
}

.assessment-builder__form {
  display: grid;
  gap: var(--sakai-space-4);
}

.assessment-builder__form-row {
  display: grid;
  gap: var(--sakai-space-4);
}

@media (min-width: 640px) {
  .assessment-builder__form-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.assessment-builder__hint {
  margin: 0;
}

.assessment-builder__embed-guide {
  border-style: dashed;
  padding: var(--sakai-space-4);
}

.assessment-builder__embed-title {
  margin: 0 0 var(--sakai-space-2);
  font-weight: var(--sakai-font-weight-semibold);
}

.assessment-builder__embed-steps {
  margin: 0;
  padding-left: var(--sakai-space-5);
  display: grid;
  gap: var(--sakai-space-2);
}

.assessment-builder__items {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
}

.builder-item {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-xl);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 85%, transparent);
  background: var(--sakai-surface-alt);
  box-shadow: var(--sakai-shadow-sm);
  cursor: grab;
  transition: border-color var(--sakai-transition-duration) var(--sakai-transition-ease),
    background var(--sakai-transition-duration) var(--sakai-transition-ease),
    box-shadow var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.builder-item--dragging {
  border-color: color-mix(in srgb, var(--sakai-primary) 35%, transparent);
  background: color-mix(in srgb, var(--sakai-primary) 8%, transparent);
  box-shadow: var(--sakai-shadow-md);
}

.builder-item:active {
  cursor: grabbing;
}

.builder-item__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sakai-space-4);
}

.builder-item__title {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-3);
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
}

.builder-item__index {
  color: var(--sakai-text-color-tertiary);
}

.builder-item__actions {
  display: inline-flex;
  gap: var(--sakai-space-2);
}

.builder-item__action {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--sakai-border-radius-md);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 85%, transparent);
  background: var(--sakai-surface);
  color: var(--sakai-text-color-tertiary);
  cursor: pointer;
  transition: background var(--sakai-transition-duration) var(--sakai-transition-ease),
    color var(--sakai-transition-duration) var(--sakai-transition-ease),
    border-color var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.builder-item__action:hover {
  background: color-mix(in srgb, var(--sakai-primary) 10%, transparent);
  color: var(--sakai-primary);
  border-color: color-mix(in srgb, var(--sakai-primary) 35%, transparent);
}

.builder-item__action--danger:hover {
  background: color-mix(in srgb, var(--sakai-danger) 12%, transparent);
  color: var(--sakai-danger);
  border-color: color-mix(in srgb, var(--sakai-danger) 35%, transparent);
}

.builder-item__action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.builder-item__body {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
}

.builder-item__points {
  max-width: 160px;
}

.builder-item__options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sakai-space-2);
}

.builder-item__option {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.75rem;
  border-radius: var(--sakai-border-radius-pill);
  background: color-mix(in srgb, var(--sakai-border-color) 80%, transparent);
  color: var(--sakai-text-color-secondary);
  font-size: 0.85rem;
  font-weight: var(--sakai-font-weight-medium);
}

.builder-item__option--correct {
  background: color-mix(in srgb, var(--sakai-success) 18%, transparent);
  color: var(--sakai-success);
}

.builder-dropzone {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-5);
  border-radius: var(--sakai-border-radius-xl);
  border: 2px dashed color-mix(in srgb, var(--sakai-primary) 45%, transparent);
  background: color-mix(in srgb, var(--sakai-primary) 6%, transparent);
  color: var(--sakai-primary);
  text-align: center;
  transition: border-color var(--sakai-transition-duration) var(--sakai-transition-ease),
    background var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.builder-dropzone:focus-visible {
  outline: none;
  box-shadow: var(--sakai-shadow-focus);
 }

.builder-dropzone__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background: var(--sakai-primary);
  color: var(--sakai-primary-contrast);
  font-weight: var(--sakai-font-weight-semibold);
}

.assessment-builder__empty {
  margin-top: var(--sakai-space-2);
}

.assessment-builder__empty-embed {
  margin-top: var(--sakai-space-4);
}

.assessment-builder__attempts-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
}

.assessment-builder__attempt {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-4);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-xl);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 85%, transparent);
  background: var(--sakai-surface);
  color: var(--sakai-text-color);
  cursor: pointer;
  transition: background var(--sakai-transition-duration) var(--sakai-transition-ease),
    border-color var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.assessment-builder__attempt:hover {
  background: color-mix(in srgb, var(--sakai-primary) 8%, transparent);
  border-color: color-mix(in srgb, var(--sakai-primary) 30%, transparent);
}

.assessment-builder__attempt-text {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-1);
  text-align: left;
}

.assessment-builder__attempt-name {
  margin: 0;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
}

.assessment-builder__attempt-meta {
  margin: 0;
  font-size: 0.85rem;
  color: var(--sakai-text-color-tertiary);
}

.assessment-builder__stats-grid {
  display: grid;
  gap: var(--sakai-space-4);
}

.assessment-builder__stats-grid dt {
  font-size: 0.85rem;
  color: var(--sakai-text-color-tertiary);
}

.assessment-builder__stats-grid dd {
  margin: 0;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
  font-size: 1.15rem;
}

.assessment-builder__attempt-status {
  display: flex;
  justify-content: flex-start;
}

.assessment-builder__attempt-grid {
  display: grid;
  gap: var(--sakai-space-4);
  margin-top: var(--sakai-space-4);
}

@media (min-width: 640px) {
  .assessment-builder__attempt-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
  }
}

.assessment-builder__attempt-label {
  display: block;
  font-size: 0.85rem;
  color: var(--sakai-text-color-tertiary);
}

.assessment-builder__attempt-value {
  display: block;
  margin-top: 0.25rem;
  font-weight: var(--sakai-font-weight-medium);
  color: var(--sakai-text-color);
}

.assessment-builder__attempt-questions {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
  margin-top: var(--sakai-space-5);
}

.assessment-builder__attempt-question {
  border-radius: var(--sakai-border-radius-xl);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 85%, transparent);
  background: var(--sakai-surface-alt);
  overflow: hidden;
}

.assessment-builder__attempt-question[open] {
  border-color: color-mix(in srgb, var(--sakai-primary) 30%, transparent);
  background: color-mix(in srgb, var(--sakai-primary) 8%, transparent);
}

.assessment-builder__attempt-question summary {
  list-style: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-4) var(--sakai-space-5);
  cursor: pointer;
  font-weight: var(--sakai-font-weight-medium);
  color: var(--sakai-text-color);
}

.assessment-builder__attempt-question summary::-webkit-details-marker {
  display: none;
}

.assessment-builder__attempt-summary {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-1);
}

.assessment-builder__attempt-scores {
  font-size: 0.85rem;
  color: var(--sakai-text-color-tertiary);
}

.assessment-builder__attempt-fields {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
  padding: 0 var(--sakai-space-5) var(--sakai-space-5);
}

.assessment-builder__attempt-extra {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-1);
}

.assessment-builder__skeleton,
.builder-skeleton__grid,
.builder-skeleton__list {
  display: grid;
  gap: var(--sakai-space-4);
}

.builder-skeleton__field,
.builder-skeleton__line,
.builder-skeleton__item {
  position: relative;
  overflow: hidden;
  border-radius: var(--sakai-border-radius-lg);
  background: color-mix(in srgb, var(--sakai-border-color) 80%, transparent);
}

.builder-skeleton__field {
  height: 56px;
}

.builder-skeleton__line {
  height: 14px;
}

.builder-skeleton__line--title {
  width: 60%;
}

.builder-skeleton__line--wide {
  width: 80%;
}

.builder-skeleton__item {
  padding: var(--sakai-space-4);
  display: grid;
  gap: var(--sakai-space-3);
}

.builder-skeleton__field::after,
.builder-skeleton__line::after,
.builder-skeleton__item::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--sakai-border-color) 40%, transparent) 0%,
    color-mix(in srgb, var(--sakai-border-color) 20%, transparent) 50%,
    color-mix(in srgb, var(--sakai-border-color) 40%, transparent) 100%
  );
  animation: builder-shimmer 1.4s infinite;
}

.builder-skeleton__item::after {
  border-radius: inherit;
}

.builder-skeleton__field::after,
.builder-skeleton__line::after {
  border-radius: inherit;
}

.builder-skeleton__list {
  gap: var(--sakai-space-3);
}

@keyframes builder-shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
</style>
