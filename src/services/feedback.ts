import api from '@/services/api';

export type FeedbackType = 'COMPLAINT' | 'SUGGESTION';

export type FeedbackReplyRole =
  | 'TEACHER'
  | 'TEACHER_ASSISTANT'
  | 'STUDENT'
  | 'PLATFORM_ADMIN';

export interface FeedbackRequest {
  type: FeedbackType;
  subject?: string;
  message: string;
  attachmentUrl?: string;
  attachmentKey?: string;
}

export interface FeedbackReplyItem {
  id: number;
  role: FeedbackReplyRole;
  accountId: number | null;
  accountEmail?: string | null;
  authorName?: string | null;
  message?: string | null;
  attachmentUrl?: string | null;
  attachmentKey?: string | null;
  createdAt: string | null;
}

export interface FeedbackResponse {
  id: number;
  type: FeedbackType;
  role: 'TEACHER' | 'TEACHER_ASSISTANT' | 'STUDENT';
  subject?: string;
  message: string;
  createdAt: string;
  attachmentUrl?: string;
  attachmentKey?: string;
  replyMessage?: string;
  replyAttachmentUrl?: string;
  replyAttachmentKey?: string;
  repliedAt?: string;
  replies: FeedbackReplyItem[];
}

export interface AdminFeedbackItem extends FeedbackResponse {
  accountId: number;
  accountEmail: string;
  actorName?: string;
  teacherId?: number | null;
  teacherName?: string | null;
  replyAccountId?: number | null;
  replyAccountEmail?: string | null;
}

export interface FeedbackReplyRequest {
  message?: string;
  attachmentUrl?: string;
  attachmentKey?: string;
}

export interface FeedbackAttachmentUploadResult {
  url: string;
  key: string;
}

export async function submitFeedback(payload: FeedbackRequest) {
  const { data } = await api.post<FeedbackResponse>('/api/v1/feedback', payload);
  return data;
}

export async function fetchUserFeedback() {
  const { data } = await api.get<FeedbackResponse[]>('/api/v1/feedback');
  return data;
}

export async function fetchAdminFeedback() {
  const { data } = await api.get<AdminFeedbackItem[]>('/api/v1/platform/feedback');
  return data;
}

export async function replyToFeedback(feedbackId: number, payload: FeedbackReplyRequest) {
  const { data } = await api.post<AdminFeedbackItem>(`/api/v1/platform/feedback/${feedbackId}/reply`, payload);
  return data;
}

export async function replyToUserFeedback(feedbackId: number, payload: FeedbackReplyRequest) {
  const { data } = await api.post<FeedbackResponse>(`/api/v1/feedback/${feedbackId}/reply`, payload);
  return data;
}

export async function uploadFeedbackAttachment(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<FeedbackAttachmentUploadResult>('/api/v1/feedback/attachments', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
}

export async function uploadAdminFeedbackAttachment(feedbackId: number, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<FeedbackAttachmentUploadResult>(
    `/api/v1/platform/feedback/${feedbackId}/attachments`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' }
    }
  );
  return data;
}
