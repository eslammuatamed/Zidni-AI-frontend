import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import {
  fetchCategories,
  fetchListenChooseQuiz,
  fetchVocabulary,
  submitProgress,
  fetchAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  type QuizItemDto,
  type VocabularyItemDto,
  type EnglishLabAssignmentDto,
  type EnglishLabAssignmentPayload
} from '../services/englishLabApi';

interface CategoryState {
  loading: boolean;
  loaded: boolean;
  error: string | null;
}

interface VocabularyState extends CategoryState {
  items: VocabularyItemDto[];
}

interface ProgressMap {
  [vocabId: string]: number;
}

interface ProgressState {
  [category: string]: ProgressMap;
}

interface AssignmentsState {
  loading: boolean;
  loaded: boolean;
  error: string | null;
}

const clampLevel = (value: number) => Math.min(5, Math.max(0, value));

const storageKey = (userId: number | null) =>
  userId != null ? `english-lab-progress-${userId}` : 'english-lab-progress-anon';

export const useEnglishLabStore = defineStore('englishLab', () => {
  const categories = ref<string[]>([]);
  const categoriesState = ref<CategoryState>({ loading: false, loaded: false, error: null });
  const vocabularies = ref<Record<string, VocabularyState>>({});
  const progress = ref<ProgressState>({});
  const userId = ref<number | null>(null);
  const quizCache = ref<Record<string, QuizItemDto[]>>({});
  const assignments = ref<EnglishLabAssignmentDto[]>([]);
  const assignmentsState = ref<AssignmentsState>({ loading: false, loaded: false, error: null });

  const masteredCounts = computed(() => {
    return Object.entries(progress.value).reduce<Record<string, number>>((acc, [category, values]) => {
      const mastered = Object.values(values).filter((level) => level >= 5).length;
      acc[category] = mastered;
      return acc;
    }, {});
  });

  const completionByCategory = computed(() => {
    return Object.entries(progress.value).reduce<Record<string, number>>((acc, [category, values]) => {
      const total = vocabularies.value[category]?.items.length ?? 0;
      if (!total) {
        acc[category] = 0;
        return acc;
      }
      const mastered = Object.values(values).filter((level) => level >= 3).length;
      acc[category] = Math.round((mastered / total) * 100);
      return acc;
    }, {});
  });

  const loadCategories = async () => {
    if (categoriesState.value.loading || categoriesState.value.loaded) {
      return;
    }
    categoriesState.value.loading = true;
    categoriesState.value.error = null;
    try {
      categories.value = await fetchCategories();
      categoriesState.value.loaded = true;
    } catch (error) {
      console.error('[english-lab] failed to load categories', error);
      categoriesState.value.error = 'labEnglish.errors.loadCategories';
    } finally {
      categoriesState.value.loading = false;
    }
  };

  const loadAssignments = async (force = false) => {
    if (assignmentsState.value.loading || (!force && assignmentsState.value.loaded)) {
      return;
    }
    assignmentsState.value.loading = true;
    assignmentsState.value.error = null;
    try {
      assignments.value = await fetchAssignments();
      assignmentsState.value.loaded = true;
    } catch (error) {
      console.error('[english-lab] failed to load assignments', error);
      assignmentsState.value.error = 'labEnglish.errors.loadAssignments';
    } finally {
      assignmentsState.value.loading = false;
    }
  };

  const saveAssignment = async (payload: EnglishLabAssignmentPayload & { id?: number }) => {
    const normalized: EnglishLabAssignmentPayload = {
      title: payload.title,
      category: payload.category,
      instructions: payload.instructions ?? null,
      dueDate: payload.dueDate ?? null
    };

    if (payload.id != null) {
      const updated = await updateAssignment(payload.id, normalized);
      assignments.value = assignments.value.map((assignment) =>
        assignment.id === updated.id ? updated : assignment
      );
      return updated;
    }

    const created = await createAssignment(normalized);
    assignments.value = [created, ...assignments.value];
    return created;
  };

  const removeAssignment = async (assignmentId: number) => {
    await deleteAssignment(assignmentId);
    assignments.value = assignments.value.filter((assignment) => assignment.id !== assignmentId);
  };

  const ensureVocabulary = async (category: string) => {
    const state = vocabularies.value[category] ?? {
      items: [],
      loading: false,
      loaded: false,
      error: null
    };
    vocabularies.value[category] = state;
    if (state.loading || state.loaded) {
      return;
    }
    state.loading = true;
    state.error = null;
    try {
      state.items = await fetchVocabulary(category);
      state.loaded = true;
    } catch (error) {
      console.error('[english-lab] failed to load vocabulary', category, error);
      state.error = 'labEnglish.errors.loadVocabulary';
    } finally {
      state.loading = false;
    }
  };

  const optimisticUpdate = (category: string, vocabId: string, correct: boolean, delta = 1) => {
    if (!progress.value[category]) {
      progress.value[category] = {};
    }
    const current = progress.value[category][vocabId] ?? 0;
    const next = correct ? clampLevel(current + Math.abs(delta)) : clampLevel(current - Math.abs(delta));
    progress.value[category][vocabId] = next;
    persistProgress();
    return next;
  };

  const persistProgress = () => {
    if (typeof window === 'undefined') {
      return;
    }
    const snapshot = JSON.stringify(progress.value);
    localStorage.setItem(storageKey(userId.value), snapshot);
  };

  const restoreProgress = () => {
    if (typeof window === 'undefined') {
      progress.value = {};
      return;
    }
    try {
      const snapshot = localStorage.getItem(storageKey(userId.value));
      if (!snapshot) {
        progress.value = {};
        return;
      }
      progress.value = JSON.parse(snapshot) as ProgressState;
    } catch (error) {
      console.warn('[english-lab] failed to restore progress from storage', error);
      progress.value = {};
    }
  };

  const setUserId = (id: number | null) => {
    if (userId.value === id) {
      return;
    }
    userId.value = id;
    restoreProgress();
  };

  const submitProgressUpdate = async (category: string, vocabId: string, correct: boolean, delta = 1) => {
    const optimisticLevel = optimisticUpdate(category, vocabId, correct, delta);
    try {
      const response = await submitProgress({
        vocabId,
        delta,
        correct,
        userId: userId.value ?? undefined
      });
      const confirmed = clampLevel(response.masteredLevel ?? optimisticLevel);
      if (!progress.value[category]) {
        progress.value[category] = {};
      }
      progress.value[category][vocabId] = confirmed;
      persistProgress();
      return confirmed;
    } catch (error) {
      console.warn('[english-lab] failed to persist progress, keeping optimistic state', error);
      return optimisticLevel;
    }
  };

  const fetchQuiz = async (category: string, size?: number, force = false) => {
    const key = `${category}:${size ?? 'default'}`;
    if (!force && quizCache.value[key]) {
      return quizCache.value[key];
    }
    const quiz = await fetchListenChooseQuiz(category, size);
    quizCache.value[key] = quiz;
    return quiz;
  };

  watch(userId, () => {
    restoreProgress();
  });

  return {
    categories,
    categoriesState,
    vocabularies,
    progress,
    masteredCounts,
    completionByCategory,
    userId,
    assignments,
    assignmentsState,
    loadCategories,
    ensureVocabulary,
    loadAssignments,
    saveAssignment,
    removeAssignment,
    submitProgressUpdate,
    fetchQuiz,
    setUserId
  };
});
