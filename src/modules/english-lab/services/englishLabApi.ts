import api from '@/services/api';

export interface VocabularyItemDto {
  id: string;
  category: string;
  englishWord: string;
  arabicWord: string;
  imagePath: string;
  audioPath: string | null;
}

export interface QuizOptionDto {
  id: string;
  englishWord: string;
  imagePath: string;
}

export interface QuizItemDto {
  vocabId: string;
  englishWord: string;
  arabicWord: string;
  imagePath: string;
  options: QuizOptionDto[];
}

export interface ProgressPayload {
  vocabId: string;
  delta: number;
  correct: boolean;
  userId?: number;
}

export interface ProgressResponse extends ProgressPayload {
  masteredLevel: number;
  lastSeenEpochMillis: number;
}

export interface EnglishLabAssignmentDto {
  id: number;
  title: string;
  category: string;
  instructions: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EnglishLabAssignmentPayload {
  title: string;
  category: string;
  instructions?: string | null;
  dueDate?: string | null;
}

export async function fetchCategories(): Promise<string[]> {
  const { data } = await api.get<string[]>('/lab/english/categories');
  return data;
}

export async function fetchVocabulary(category: string): Promise<VocabularyItemDto[]> {
  const { data } = await api.get<VocabularyItemDto[]>(`/lab/english/words/${encodeURIComponent(category)}`);
  return data;
}

export async function submitProgress(payload: ProgressPayload): Promise<ProgressResponse> {
  const { data } = await api.post<ProgressResponse>('/lab/english/progress', payload);
  return data;
}

export async function fetchListenChooseQuiz(category: string, size?: number): Promise<QuizItemDto[]> {
  const { data } = await api.post<QuizItemDto[]>('/lab/english/quiz/listen-choose', {
    category,
    size
  });
  return data;
}

export async function fetchAssignments(): Promise<EnglishLabAssignmentDto[]> {
  const { data } = await api.get<EnglishLabAssignmentDto[]>('/lab/english/assignments');
  return data;
}

export async function createAssignment(payload: EnglishLabAssignmentPayload): Promise<EnglishLabAssignmentDto> {
  const { data } = await api.post<EnglishLabAssignmentDto>('/lab/english/assignments', payload);
  return data;
}

export async function updateAssignment(
  assignmentId: number,
  payload: EnglishLabAssignmentPayload
): Promise<EnglishLabAssignmentDto> {
  const { data } = await api.put<EnglishLabAssignmentDto>(`/lab/english/assignments/${assignmentId}`, payload);
  return data;
}

export async function deleteAssignment(assignmentId: number): Promise<void> {
  await api.delete(`/lab/english/assignments/${assignmentId}`);
}
