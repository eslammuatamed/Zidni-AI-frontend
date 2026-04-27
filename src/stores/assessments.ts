import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import axios from 'axios';
import {
  fetchQuestionBanks,
  fetchQuestionBank,
  createQuestionBank,
  updateQuestionBank,
  deleteQuestionBank,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  fetchAssessments,
  fetchAssessment,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  addAssessmentItem,
  updateAssessmentItem,
  deleteAssessmentItem,
  fetchAssessmentAttempts,
  fetchAssessmentAttempt,
  overrideAssessmentAttempt,
  fetchStudentAssessments,
  fetchStudentAssessment,
  fetchLatestStudentAttempt,
  submitStudentAttempt,
  type AssessmentAttemptResponse,
  type AssessmentAttemptSummary,
  type AssessmentDetailResponse,
  type AssessmentItemResponse,
  type AssessmentSummaryResponse,
  type AttemptOverridePayload,
  type QuestionBankDetailResponse,
  type QuestionBankSummaryResponse,
  type QuestionDetailResponse,
  type QuestionOptionPayload,
  type CreateAssessmentPayload,
  type UpdateAssessmentPayload,
  type AddAssessmentItemPayload,
  type UpdateAssessmentItemPayload,
  type CreateQuestionBankPayload,
  type UpdateQuestionBankPayload,
  type CreateQuestionPayload,
  type UpdateQuestionPayload,
  type StudentAssessmentSummary,
  type StudentAssessmentDetailResponse,
  type StudentAttemptResult,
  type SubmitStudentAttemptPayload
} from '@/services/assessments';
import {
  generateAiQuestions as requestAiQuestions,
  type QuestionGenerationPayload,
  type QuestionGenerationResult
} from '@/services/ai';

export type AssessmentError = 'forbidden' | 'unauthorized' | 'not-found' | 'server' | 'network';

const bankCache = new Map<number, QuestionBankDetailResponse>();

function normalizeAssessment(detail: AssessmentDetailResponse): AssessmentDetailResponse {
  const seen = new Set<number>();
  const deduped = detail.items
    .filter((item) => {
      if (seen.has(item.id)) {
        return false;
      }
      seen.add(item.id);
      return true;
    })
    .slice()
    .sort((a, b) => a.position - b.position);
  return { ...detail, items: deduped };
}

export const useAssessmentsStore = defineStore('assessments', () => {
  // Question banks
  const banks = ref<QuestionBankSummaryResponse[]>([]);
  const selectedBankId = ref<number | null>(null);
  const selectedBank = ref<QuestionBankDetailResponse | null>(null);
  const loadingBanks = ref(false);
  const loadingBank = ref(false);
  const banksError = ref<AssessmentError | null>(null);
  const bankError = ref<AssessmentError | null>(null);

  // Teacher assessments
  const assessments = ref<AssessmentSummaryResponse[]>([]);
  const currentAssessment = ref<AssessmentDetailResponse | null>(null);
  const attempts = ref<AssessmentAttemptSummary[]>([]);
  const currentAttempt = ref<AssessmentAttemptResponse | null>(null);

  // Student view
  const studentAssessments = ref<StudentAssessmentSummary[]>([]);
  const currentStudentAssessment = ref<StudentAssessmentDetailResponse | null>(null);
  const currentStudentAttempt = ref<AssessmentAttemptResponse | null>(null);
  const lastStudentAttempt = ref<StudentAttemptResult | null>(null);

  const hasBanks = computed(() => banks.value.length > 0);
  const currentBank = computed(() => selectedBank.value);

  function upsertBankSummary(summary: QuestionBankSummaryResponse) {
    const existingIndex = banks.value.findIndex((item) => item.id === summary.id);
    if (existingIndex >= 0) {
      banks.value.splice(existingIndex, 1, summary);
    } else {
      banks.value.unshift(summary);
    }
  }

  function updateSummaryWithDetail(detail: QuestionBankDetailResponse) {
    const questionCount = detail.questions.length;
    const tagSet = new Set<string>();
    detail.questions.forEach((question) => {
      question.tags.forEach((tag) => tagSet.add(tag));
    });
    detail.tags = Array.from(tagSet);
    upsertBankSummary({
      id: detail.id,
      name: detail.name,
      description: detail.description,
      questionCount,
      updatedAt: detail.updatedAt,
      tags: detail.tags
    });
  }

  async function loadBanks() {
    loadingBanks.value = true;
    banksError.value = null;
    try {
      const data = await fetchQuestionBanks();
      banks.value = data;
      if (!banks.value.length) {
        selectedBankId.value = null;
        selectedBank.value = null;
        return;
      }
      if (!selectedBankId.value || !banks.value.some((bank) => bank.id === selectedBankId.value)) {
        await selectBank(banks.value[0].id);
      } else {
        await loadBank(selectedBankId.value);
      }
    } catch (error) {
      banksError.value = resolveError(error);
    } finally {
      loadingBanks.value = false;
    }
  }

  async function selectBank(id: number) {
    if (selectedBankId.value === id && selectedBank.value) {
      return;
    }
    selectedBankId.value = id;
    await loadBank(id);
  }

  async function loadBank(id?: number) {
    const target = typeof id === 'number' ? id : selectedBankId.value;
    if (!target) {
      return;
    }
    loadingBank.value = true;
    bankError.value = null;
    try {
      const detail = await fetchQuestionBank(target);
      bankCache.set(target, detail);
      selectedBank.value = detail;
      updateSummaryWithDetail(detail);
    } catch (error) {
      bankError.value = resolveError(error);
      if (bankError.value === 'not-found') {
        bankCache.delete(target);
        selectedBankId.value = null;
      }
      selectedBank.value = null;
    } finally {
      loadingBank.value = false;
    }
  }

  async function createBank(payload: CreateQuestionBankPayload) {
    const detail = await createQuestionBank(payload);
    bankCache.set(detail.id, detail);
    updateSummaryWithDetail(detail);
    selectedBankId.value = detail.id;
    selectedBank.value = detail;
    return detail.id;
  }

  async function editBank(id: number, payload: UpdateQuestionBankPayload) {
    const detail = await updateQuestionBank(id, payload);
    bankCache.set(id, detail);
    updateSummaryWithDetail(detail);
    if (selectedBankId.value === id) {
      selectedBank.value = detail;
    }
  }

  async function removeBank(id: number) {
    await deleteQuestionBank(id);
    bankCache.delete(id);
    banks.value = banks.value.filter((bank) => bank.id !== id);
    if (selectedBankId.value === id) {
      selectedBankId.value = null;
      selectedBank.value = null;
      if (banks.value.length) {
        await selectBank(banks.value[0].id);
      }
    }
  }

  function mergeQuestionDetail(detail: QuestionDetailResponse) {
    if (!selectedBank.value) {
      return;
    }
    const existingIndex = selectedBank.value.questions.findIndex((question) => question.id === detail.id);
    if (existingIndex >= 0) {
      selectedBank.value.questions.splice(existingIndex, 1, detail);
    } else {
      selectedBank.value.questions.push(detail);
      selectedBank.value.questions.sort((a, b) => a.id - b.id);
    }
    const cached = bankCache.get(selectedBank.value.id);
    if (cached) {
      cached.questions = [...selectedBank.value.questions];
      bankCache.set(cached.id, cached);
    }
    updateSummaryWithDetail(selectedBank.value);
  }

  async function addQuestion(bankId: number, payload: CreateQuestionPayload) {
    const detail = await createQuestion(bankId, payload);
    if (selectedBankId.value === bankId) {
      mergeQuestionDetail(detail);
    }
    return detail;
  }

  async function generateAiQuestions(
    bankId: number,
    payload: QuestionGenerationPayload
  ): Promise<QuestionGenerationResult> {
    return await requestAiQuestions(payload, bankId);
  }

  async function editQuestion(bankId: number, questionId: number, payload: UpdateQuestionPayload) {
    const detail = await updateQuestion(bankId, questionId, payload);
    if (selectedBankId.value === bankId) {
      mergeQuestionDetail(detail);
    }
    return detail;
  }

  async function removeQuestion(bankId: number, questionId: number) {
    await deleteQuestion(bankId, questionId);
    if (selectedBankId.value === bankId && selectedBank.value) {
      selectedBank.value.questions = selectedBank.value.questions.filter((question) => question.id !== questionId);
      const cached = bankCache.get(bankId);
      if (cached) {
        cached.questions = [...selectedBank.value.questions];
        bankCache.set(bankId, cached);
      }
      updateSummaryWithDetail(selectedBank.value);
    }
  }

  function mergeAssessmentSummary(detail: AssessmentDetailResponse): AssessmentDetailResponse {
    const normalized = normalizeAssessment(detail);
    const existingIndex = assessments.value.findIndex((item) => item.id === normalized.id);
    const summary: AssessmentSummaryResponse = {
      id: normalized.id,
      title: normalized.title,
      type: normalized.type,
      courseId: normalized.courseId,
      courseTitle: normalized.courseTitle,
      durationMinutes: normalized.durationMinutes,
      maxScore: normalized.type === 'external_form' ? 0 : normalized.maxScore,
      questionCount: normalized.type === 'external_form' ? 0 : normalized.items.length,
      maxAttempts: normalized.maxAttempts,
      revealAnswersAfterGrading: normalized.revealAnswersAfterGrading
    };
    if (existingIndex >= 0) {
      assessments.value.splice(existingIndex, 1, summary);
    } else {
      assessments.value.unshift(summary);
    }
    return normalized;
  }

  async function loadAssessments() {
    const data = await fetchAssessments();
    assessments.value = data;
  }

  async function loadAssessmentDetail(id: number) {
    const detail = await fetchAssessment(id);
    const normalized = mergeAssessmentSummary(detail);
    currentAssessment.value = normalized;
    return normalized;
  }

  async function createTeacherAssessment(payload: CreateAssessmentPayload) {
    const detail = await createAssessment(payload);
    const normalized = mergeAssessmentSummary(detail);
    currentAssessment.value = normalized;
    return normalized.id;
  }

  async function editAssessment(id: number, payload: UpdateAssessmentPayload) {
    const detail = await updateAssessment(id, payload);
    const normalized = mergeAssessmentSummary(detail);
    currentAssessment.value = normalized;
  }

  async function removeAssessment(id: number) {
    await deleteAssessment(id);
    assessments.value = assessments.value.filter((item) => item.id !== id);
    if (currentAssessment.value?.id === id) {
      currentAssessment.value = null;
    }
  }

  async function appendAssessmentItem(assessmentId: number, payload: AddAssessmentItemPayload) {
    const detail = await addAssessmentItem(assessmentId, payload);
    const normalized = mergeAssessmentSummary(detail);
    currentAssessment.value = normalized;
    return normalized.items[normalized.items.length - 1];
  }

  async function modifyAssessmentItem(
    assessmentId: number,
    itemId: number,
    payload: UpdateAssessmentItemPayload
  ) {
    const detail = await updateAssessmentItem(assessmentId, itemId, payload);
    const normalized = mergeAssessmentSummary(detail);
    currentAssessment.value = normalized;
  }

  async function removeAssessmentItem(assessmentId: number, itemId: number) {
    await deleteAssessmentItem(assessmentId, itemId);
    if (currentAssessment.value && currentAssessment.value.id === assessmentId) {
      const updated = {
        ...currentAssessment.value,
    items: currentAssessment.value.items.filter((item: { id: number }) => item.id !== itemId)
      };
      currentAssessment.value = mergeAssessmentSummary(updated);
    }
  }

  async function loadAttempts(assessmentId: number) {
    attempts.value = await fetchAssessmentAttempts(assessmentId);
  }

  async function loadAttemptDetail(assessmentId: number, attemptId: number) {
    currentAttempt.value = await fetchAssessmentAttempt(assessmentId, attemptId);
    return currentAttempt.value;
  }

  async function overrideAttempt(
    assessmentId: number,
    attemptId: number,
    payload: AttemptOverridePayload
  ) {
    currentAttempt.value = await overrideAssessmentAttempt(assessmentId, attemptId, payload);
    attempts.value = await fetchAssessmentAttempts(assessmentId);
  }

  async function loadStudentAssessments() {
    studentAssessments.value = await fetchStudentAssessments();
  }

  async function loadStudentAssessmentDetail(id: number) {
    currentStudentAssessment.value = await fetchStudentAssessment(id);
    return currentStudentAssessment.value;
  }

  async function loadLatestStudentAttemptDetail(assessmentId: number) {
    currentStudentAttempt.value = await fetchLatestStudentAttempt(assessmentId);
    return currentStudentAttempt.value;
  }

  async function submitStudentAssessmentAttempt(
    assessmentId: number,
    payload: SubmitStudentAttemptPayload
  ) {
    lastStudentAttempt.value = await submitStudentAttempt(assessmentId, payload);
    currentStudentAttempt.value = null;
    await loadStudentAssessments();
    return lastStudentAttempt.value;
  }

  function clearErrors() {
    banksError.value = null;
    bankError.value = null;
  }

  return {
    // Question banks
    banks,
    selectedBankId,
    selectedBank,
    currentBank,
    loadingBanks,
    loadingBank,
    banksError,
    bankError,
    hasBanks,
    loadBanks,
    loadBank,
    selectBank,
    createBank,
    editBank,
    removeBank,
    addQuestion,
    generateAiQuestions,
    editQuestion,
    removeQuestion,
    clearErrors,
    // Teacher assessments
    assessments,
    currentAssessment,
    attempts,
    currentAttempt,
    loadAssessments,
    loadAssessment: loadAssessmentDetail,
    createAssessment: createTeacherAssessment,
    updateAssessment: editAssessment,
    deleteAssessment: removeAssessment,
    addAssessmentItem: appendAssessmentItem,
    updateAssessmentItem: modifyAssessmentItem,
    deleteAssessmentItem: removeAssessmentItem,
    loadAttempts,
    loadAttemptDetail,
    overrideAttempt,
    // Student flows
    studentAssessments,
    currentStudentAssessment,
    currentStudentAttempt,
    lastStudentAttempt,
    loadStudentAssessments,
    loadStudentAssessment: loadStudentAssessmentDetail,
    loadLatestStudentAttempt: loadLatestStudentAttemptDetail,
    submitStudentAttempt: submitStudentAssessmentAttempt
  };
});

function resolveError(error: unknown): AssessmentError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    if (status === 401) {
      return 'unauthorized';
    }
    if (status === 403) {
      return 'forbidden';
    }
    if (status === 404) {
      return 'not-found';
    }
    if (status >= 500) {
      return 'server';
    }
  }
  return 'network';
}
