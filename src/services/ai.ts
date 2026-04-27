import axios from 'axios';
import api from './api';

export interface LessonSummaryPayload {
  lessonTitle: string;
  lessonBody: string;
  objectives?: string[];
  audience?: string;
  language?: string;
  includeKeyTakeaways?: boolean;
}

export interface LessonSummaryExportPayload {
  lessonTitle: string;
  summary: string;
  keyTakeaways?: string[];
  language?: string;
}

export interface LessonSummaryResult {
  summary: string;
  keyTakeaways: string[];
  language?: string;
  tone?: string;
}

export interface LessonRewritePayload {
  lessonTitle: string;
  originalContent: string;
  desiredTone?: string;
  language?: string;
  audienceFocus?: string;
}

export interface LessonRewriteResult {
  rewrittenContent: string;
  language?: string;
  tone?: string;
  rationale?: string;
}

export interface LessonAdaptationPayload {
  lessonTitle: string;
  sourceContent: string;
  targetLevel: string;
  language?: string;
  culturalContext?: string;
}

export interface LessonAdaptationResult {
  adaptedContent: string;
  readingLevel?: string;
  language?: string;
  differentiationTips?: string;
}

export interface GeneratedOption {
  key: string;
  text: string;
}

export type GeneratedQuestionType =
  | 'MCQ_SINGLE'
  | 'MCQ_MULTI'
  | 'TRUEFALSE'
  | 'SHORT'
  | 'LONG'
  | string;

export interface GeneratedQuestion {
  stem: string;
  type: GeneratedQuestionType;
  options: GeneratedOption[];
  answerKey?: string | null;
  difficulty?: string | null;
  explanation?: string | null;
}

export interface QuestionGenerationPayload {
  subject: string;
  sourceMaterial: string;
  language?: string;
  learningObjectives?: string[];
  questionCount: number;
  difficulty?: string;
}

export interface QuestionGenerationResult {
  questions: GeneratedQuestion[];
  providerModel?: string | null;
  language?: string | null;
}

export interface StudentTldrPayload {
  lessonTitle: string;
  sourceMaterial: string;
  focusPoints?: string[];
  language?: string;
  includeStudyTips?: boolean;
  sentenceLimit?: number;
}

export interface StudentTldrResult {
  headline: string;
  summary: string;
  highlights: string[];
  studyTips: string[];
  language?: string;
}

export interface StudentFlashcardPayload {
  lessonTitle: string;
  sourceMaterial: string;
  focusTerms?: string[];
  language?: string;
  cardCount?: number;
  difficultyHint?: string;
}

export interface Flashcard {
  front: string;
  back: string;
  hint?: string | null;
  tag?: string | null;
}

export interface StudentFlashcardResult {
  cards: Flashcard[];
  language?: string;
  studyTip?: string | null;
}

export interface StudentPracticeQuestionPayload {
  topic: string;
  sourceMaterial: string;
  skills?: string[];
  language?: string;
  questionCount?: number;
  difficulty?: string;
}

export interface StudentPracticeQuestionResult {
  questions: GeneratedQuestion[];
  reflectionPrompt?: string | null;
  language?: string | null;
}

export interface StudentAnswerFeedbackPayload {
  question: string;
  studentAnswer: string;
  expectedAnswer?: string;
  rubric?: string;
  language?: string;
  skillFocus?: string;
}

export interface StudentAnswerFeedbackResult {
  verdict: string;
  score: number;
  strengths: string[];
  improvements: string[];
  nextSteps?: string | null;
  language?: string | null;
}

export async function generateLessonSummary(
  lessonId: number,
  payload: LessonSummaryPayload
): Promise<LessonSummaryResult> {
  const { data } = await api.post<LessonSummaryResult>(
    `/api/v1/teacher/ai/lessons/${lessonId}/summaries`,
    payload
  );
  return data;
}

export async function exportLessonSummaryPdf(
  lessonId: number,
  payload: LessonSummaryExportPayload
): Promise<Blob> {
  const { data } = await api.post<ArrayBuffer>(
    `/api/v1/teacher/ai/lessons/${lessonId}/summaries/export`,
    payload,
    { responseType: 'arraybuffer' }
  );
  return new Blob([data], { type: 'application/pdf' });
}

export async function rewriteLesson(
  lessonId: number,
  payload: LessonRewritePayload
): Promise<LessonRewriteResult> {
  const { data } = await api.post<LessonRewriteResult>(
    `/api/v1/teacher/ai/lessons/${lessonId}/rewrites`,
    payload
  );
  return data;
}

export async function adaptLesson(
  lessonId: number,
  payload: LessonAdaptationPayload
): Promise<LessonAdaptationResult> {
  const { data } = await api.post<LessonAdaptationResult>(
    `/api/v1/teacher/ai/lessons/${lessonId}/adaptations`,
    payload
  );
  return data;
}

export async function generateAiQuestions(
  payload: QuestionGenerationPayload,
  bankId: number
): Promise<QuestionGenerationResult> {
  const url = `/api/v1/teacher/question-banks/${bankId}/ai/questions`;
  const baseConfig = { timeout: 140_000 };
  try {
    const { data } = await api.post<QuestionGenerationResult>(url, payload, baseConfig);
    return data;
  } catch (error) {
    if (!isRetryableAiError(error)) {
      throw error;
    }
    const retryConfig = { timeout: 160_000 };
    const { data } = await api.post<QuestionGenerationResult>(url, payload, retryConfig);
    return data;
  }
}

function isRetryableAiError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }
  if (error.code === 'ECONNABORTED') {
    return true;
  }
  const status = error.response?.status;
  return status === 408 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

export async function generateStudentTldr(payload: StudentTldrPayload): Promise<StudentTldrResult> {
  const { data } = await api.post<StudentTldrResult>('/api/v1/students/ai/tldr', payload);
  return data;
}

export async function generateStudentFlashcards(
  payload: StudentFlashcardPayload
): Promise<StudentFlashcardResult> {
  const { data } = await api.post<StudentFlashcardResult>('/api/v1/students/ai/flashcards', payload);
  return data;
}

export async function generateStudentPracticeQuestions(
  payload: StudentPracticeQuestionPayload
): Promise<StudentPracticeQuestionResult> {
  const { data } = await api.post<StudentPracticeQuestionResult>(
    '/api/v1/students/ai/practice-questions',
    payload
  );
  return data;
}

export async function requestStudentAnswerFeedback(
  payload: StudentAnswerFeedbackPayload
): Promise<StudentAnswerFeedbackResult> {
  const { data } = await api.post<StudentAnswerFeedbackResult>('/api/v1/students/ai/feedback', payload);
  return data;
}
