import api from '@/services/api';

export type DiscussionAuthorType = 'teacher' | 'student';

export interface DiscussionThread {
  id: number;
  courseId: number;
  courseTitle: string;
  lessonId?: number | null;
  lessonTitle?: string | null;
  title: string;
  createdBy: DiscussionAuthorType;
  createdByName: string;
  createdAt: string;
  messageCount: number;
}

export interface DiscussionMessage {
  id: number;
  threadId: number;
  author: DiscussionAuthorType;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface PagedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export interface ThreadFilters {
  courseId: number;
  lessonId?: number;
  q?: string;
  page?: number;
  size?: number;
}

export interface CreateThreadPayload {
  courseId: number;
  title: string;
  lessonId?: number | null;
}

export interface MessageFilters {
  page?: number;
  size?: number;
}

export interface CreateMessagePayload {
  body: string;
}

export async function listThreads(filters: ThreadFilters) {
  const params: Record<string, unknown> = {
    courseId: filters.courseId,
    page: filters.page ?? 0,
    size: filters.size ?? 20
  };
  if (typeof filters.lessonId === 'number') {
    params.lessonId = filters.lessonId;
  }
  if (filters.q) {
    params.q = filters.q;
  }
  const { data } = await api.get<PagedResponse<DiscussionThread>>('/discussions/threads', { params });
  return data;
}

export async function createThread(payload: CreateThreadPayload) {
  const body: CreateThreadPayload = {
    courseId: payload.courseId,
    title: payload.title.trim(),
    lessonId: payload.lessonId ?? undefined
  };
  const { data } = await api.post<DiscussionThread>('/discussions/threads', body);
  return data;
}

export async function listMessages(threadId: number, filters: MessageFilters = {}) {
  const params: Record<string, unknown> = {
    page: filters.page ?? 0,
    size: filters.size ?? 20
  };
  const { data } = await api.get<PagedResponse<DiscussionMessage>>(`/discussions/threads/${threadId}/messages`, { params });
  return data;
}

export async function postMessage(threadId: number, payload: CreateMessagePayload) {
  const { data } = await api.post<DiscussionMessage>(`/discussions/threads/${threadId}/messages`, payload);
  return data;
}

export default {
  listThreads,
  createThread,
  listMessages,
  postMessage
};
