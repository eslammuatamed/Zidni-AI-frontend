import api from './api';

export type QuestionType = 'mcq_single' | 'mcq_multi' | 'truefalse' | 'short';
export type AssessmentType = 'quiz' | 'exam' | 'external_form';
export type AttemptStatus = 'in_progress' | 'submitted' | 'pending_result' | 'graded' | 'void';

export interface QuestionOptionResponse {
  id: number;
  key: string;
  label: string;
  text: string;
  correct: boolean;
  position: number;
}

export interface QuestionVersionResponse {
  id: number;
  type: QuestionType;
  stem: string;
  points: number;
  shuffle: boolean;
  createdAt: string;
  options: QuestionOptionResponse[];
}

export interface QuestionDetailResponse {
  id: number;
  tags: string[];
  currentVersion: QuestionVersionResponse | null;
  history: QuestionVersionResponse[];
}

export interface QuestionBankSummaryResponse {
  id: number;
  name: string;
  description?: string | null;
  questionCount: number;
  updatedAt?: string | null;
  tags: string[];
}

export interface QuestionBankDetailResponse {
  id: number;
  name: string;
  description?: string | null;
  updatedAt?: string | null;
  questions: QuestionDetailResponse[];
  tags?: string[];
}

export interface QuestionOptionPayload {
  key: string;
  text: string;
  label?: string | null;
}

export interface CreateQuestionBankPayload {
  name: string;
  description?: string | null;
}

export interface UpdateQuestionBankPayload {
  name?: string | null;
  description?: string | null;
}

export interface CreateQuestionPayload {
  stem: string;
  type: QuestionType;
  points: number;
  shuffle?: boolean | null;
  options?: QuestionOptionPayload[] | null;
  correctOptionKeys?: string[] | null;
}

export interface UpdateQuestionPayload {
  stem?: string | null;
  type?: QuestionType | null;
  points?: number | null;
  shuffle?: boolean | null;
  options?: QuestionOptionPayload[] | null;
  correctOptionKeys?: string[] | null;
}

export interface AssessmentSummaryResponse {
  id: number;
  title: string;
  type: AssessmentType;
  courseId: number;
  courseTitle: string;
  durationMinutes: number;
  maxScore: number;
  questionCount: number;
  maxAttempts: number;
  revealAnswersAfterGrading: boolean;
}

export interface AssessmentItemResponse {
  id: number;
  questionId: number;
  questionVersionId: number;
  type: QuestionType;
  stem: string;
  points: number;
  shuffle: boolean;
  position: number;
  options: QuestionOptionResponse[];
}

export interface AssessmentDetailResponse {
  id: number;
  title: string;
  type: AssessmentType;
  courseId: number;
  courseTitle: string;
  durationMinutes: number;
  maxScore: number;
  embedUrl?: string | null;
  maxAttempts: number;
  revealAnswersAfterGrading: boolean;
  items: AssessmentItemResponse[];
}

export interface AssessmentAttemptSummary {
  id: number;
  studentId: number;
  studentName: string;
  autoScore: number;
  manualScore: number;
  status: AttemptStatus;
  submittedAt: string | null;
}

export interface AttemptQuestionResponse {
  id: number;
  questionId: number;
  questionVersionId: number;
  type: QuestionType;
  stem: string;
  points: number;
  autoScore: number;
  manualScore: number;
  selectedOptionKeys: string[];
  correctOptionKeys: string[];
  options: QuestionOptionResponse[];
  correct: boolean;
  textAnswer: string | null;
  gradedAt: string | null;
  feedback: string | null;
  position: number;
}

export interface AssessmentAttemptResponse {
  id: number;
  assessmentId: number;
  studentId: number;
  studentName: string;
  autoScore: number;
  manualScore: number;
  status: AttemptStatus;
  submittedAt: string | null;
  questions: AttemptQuestionResponse[];
}

export interface AssessmentPlayQuestionResponse {
  itemId: number;
  questionVersionId: number;
  type: QuestionType;
  stem: string;
  points: number;
  shuffle: boolean;
  options: QuestionOptionResponse[];
}

export interface StudentAssessmentSummary {
  id: number;
  title: string;
  courseTitle: string;
  type: AssessmentType;
  durationMinutes: number;
  maxScore: number;
  questionCount: number;
  maxAttempts: number;
  attemptsUsed: number;
  revealAnswersAfterGrading: boolean;
  latestAttemptId?: number | null;
  latestAttemptStatus?: AttemptStatus | null;
  latestAutoScore?: number | null;
  latestManualScore?: number | null;
  latestSubmittedAt?: string | null;
}

export interface StudentAssessmentDetailResponse {
  id: number;
  title: string;
  type: AssessmentType;
  durationMinutes: number;
  maxScore: number;
  embedUrl?: string | null;
  maxAttempts: number;
  revealAnswersAfterGrading: boolean;
  questions: AssessmentPlayQuestionResponse[];
}

export interface StudentAttemptResult {
  attemptId: number;
  assessmentId: number;
  autoScore: number;
  manualScore: number;
  status: AttemptStatus;
  submittedAt: string | null;
}

export interface CreateAssessmentPayload {
  courseId: number;
  title: string;
  type?: AssessmentType;
  durationMinutes?: number;
  embedUrl?: string | null;
  maxAttempts?: number;
  revealAnswersAfterGrading?: boolean;
}

export interface UpdateAssessmentPayload {
  title?: string;
  type?: AssessmentType;
  durationMinutes?: number;
  embedUrl?: string | null;
  maxAttempts?: number;
  revealAnswersAfterGrading?: boolean;
}

export interface AddAssessmentItemPayload {
  questionId: number;
  questionVersionId?: number | null;
  position?: number | null;
  points?: number | null;
  poolKey?: string | null;
}

export interface UpdateAssessmentItemPayload {
  position?: number | null;
  points?: number | null;
  poolKey?: string | null;
}

export interface AttemptOverrideQuestionPayload {
  attemptQuestionId: number;
  manualScore?: number | null;
  feedback?: string | null;
}

export interface AttemptOverridePayload {
  manualScore?: number | null;
  questions?: AttemptOverrideQuestionPayload[] | null;
}

export interface StudentAnswerPayload {
  itemId: number;
  selectedOptionKeys?: string[] | null;
  textAnswer?: string | null;
}

export interface SubmitStudentAttemptPayload {
  answers: StudentAnswerPayload[];
  elapsedSeconds?: number | null;
}

export async function fetchQuestionBanks(): Promise<QuestionBankSummaryResponse[]> {
  const { data } = await api.get<QuestionBankSummaryResponse[]>('/api/v1/teacher/question-banks');
  return data;
}

export async function fetchQuestionBank(id: number): Promise<QuestionBankDetailResponse> {
  const { data } = await api.get<QuestionBankDetailResponse>(`/api/v1/teacher/question-banks/${id}`);
  return data;
}

export async function createQuestionBank(payload: CreateQuestionBankPayload): Promise<QuestionBankDetailResponse> {
  const { data } = await api.post<QuestionBankDetailResponse>('/api/v1/teacher/question-banks', payload);
  return data;
}

export async function updateQuestionBank(
  id: number,
  payload: UpdateQuestionBankPayload
): Promise<QuestionBankDetailResponse> {
  const { data } = await api.put<QuestionBankDetailResponse>(`/api/v1/teacher/question-banks/${id}`, payload);
  return data;
}

export async function deleteQuestionBank(id: number): Promise<void> {
  await api.delete(`/api/v1/teacher/question-banks/${id}`);
}

export async function createQuestion(bankId: number, payload: CreateQuestionPayload): Promise<QuestionDetailResponse> {
  const { data } = await api.post<QuestionDetailResponse>(
    `/api/v1/teacher/question-banks/${bankId}/questions`,
    payload
  );
  return data;
}

export async function updateQuestion(
  bankId: number,
  questionId: number,
  payload: UpdateQuestionPayload
): Promise<QuestionDetailResponse> {
  const { data } = await api.put<QuestionDetailResponse>(
    `/api/v1/teacher/question-banks/${bankId}/questions/${questionId}`,
    payload
  );
  return data;
}

export async function deleteQuestion(bankId: number, questionId: number): Promise<void> {
  await api.delete(`/api/v1/teacher/question-banks/${bankId}/questions/${questionId}`);
}

export async function fetchAssessments(): Promise<AssessmentSummaryResponse[]> {
  const { data } = await api.get<AssessmentSummaryResponse[]>('/api/v1/teacher/assessments');
  return data;
}

export async function fetchAssessment(id: number): Promise<AssessmentDetailResponse> {
  const { data } = await api.get<AssessmentDetailResponse>(`/api/v1/teacher/assessments/${id}`);
  return data;
}

export async function createAssessment(payload: CreateAssessmentPayload): Promise<AssessmentDetailResponse> {
  const { data } = await api.post<AssessmentDetailResponse>('/api/v1/teacher/assessments', payload);
  return data;
}

export async function updateAssessment(
  id: number,
  payload: UpdateAssessmentPayload
): Promise<AssessmentDetailResponse> {
  const { data } = await api.put<AssessmentDetailResponse>(`/api/v1/teacher/assessments/${id}`, payload);
  return data;
}

export async function deleteAssessment(id: number): Promise<void> {
  await api.delete(`/api/v1/teacher/assessments/${id}`);
}

export async function addAssessmentItem(
  assessmentId: number,
  payload: AddAssessmentItemPayload
): Promise<AssessmentDetailResponse> {
  const { data } = await api.post<AssessmentDetailResponse>(
    `/api/v1/teacher/assessments/${assessmentId}/items`,
    payload
  );
  return data;
}

export async function updateAssessmentItem(
  assessmentId: number,
  itemId: number,
  payload: UpdateAssessmentItemPayload
): Promise<AssessmentDetailResponse> {
  const { data } = await api.put<AssessmentDetailResponse>(
    `/api/v1/teacher/assessments/${assessmentId}/items/${itemId}`,
    payload
  );
  return data;
}

export async function deleteAssessmentItem(assessmentId: number, itemId: number): Promise<void> {
  await api.delete(`/api/v1/teacher/assessments/${assessmentId}/items/${itemId}`);
}

export async function fetchAssessmentAttempts(assessmentId: number): Promise<AssessmentAttemptSummary[]> {
  const { data } = await api.get<AssessmentAttemptSummary[]>(
    `/api/v1/teacher/assessments/${assessmentId}/attempts`
  );
  return data;
}

export async function fetchAssessmentAttempt(
  assessmentId: number,
  attemptId: number
): Promise<AssessmentAttemptResponse> {
  const { data } = await api.get<AssessmentAttemptResponse>(
    `/api/v1/teacher/assessments/${assessmentId}/attempts/${attemptId}`
  );
  return data;
}

export async function overrideAssessmentAttempt(
  assessmentId: number,
  attemptId: number,
  payload: AttemptOverridePayload
): Promise<AssessmentAttemptResponse> {
  const { data } = await api.put<AssessmentAttemptResponse>(
    `/api/v1/teacher/assessments/${assessmentId}/attempts/${attemptId}/override`,
    payload
  );
  return data;
}

export async function fetchStudentAssessments(): Promise<StudentAssessmentSummary[]> {
  const { data } = await api.get<StudentAssessmentSummary[]>('/api/v1/student/assessments');
  return data;
}

export async function fetchStudentAssessment(id: number): Promise<StudentAssessmentDetailResponse> {
  const { data } = await api.get<StudentAssessmentDetailResponse>(`/api/v1/student/assessments/${id}`);
  return data;
}

export async function fetchLatestStudentAttempt(
  assessmentId: number
): Promise<AssessmentAttemptResponse> {
  const { data } = await api.get<AssessmentAttemptResponse>(
    `/api/v1/student/assessments/${assessmentId}/attempts/latest`
  );
  return data;
}

export async function submitStudentAttempt(
  assessmentId: number,
  payload: SubmitStudentAttemptPayload
): Promise<StudentAttemptResult> {
  const { data } = await api.post<StudentAttemptResult>(
    `/api/v1/student/assessments/${assessmentId}/attempts`,
    payload
  );
  return data;
}
