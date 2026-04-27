import api from '@/services/api';

export type LiveChatSenderType = 'student' | 'teacher' | 'system';

export interface LiveChatMessage {
  id: number;
  sessionId: number;
  senderType: LiveChatSenderType;
  teacherId?: number | null;
  teacherName?: string | null;
  studentId?: number | null;
  studentName?: string | null;
  message: string;
  sentAt: string;
}

export interface LiveChatMessagesResponse {
  items: LiveChatMessage[];
  nextSince?: string | null;
}

export interface LiveChatMessagesQuery {
  since?: string;
  limit?: number;
}

export interface LiveChatMessagePayload {
  message: string;
}

export interface LiveSessionBanPayload {
  studentId: number;
  reason?: string | null;
}

export interface LiveSessionBan {
  sessionId: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  reason?: string | null;
  bannedBy?: number | null;
  bannedByName?: string | null;
  createdAt: string;
}

export async function listChatMessages(sessionId: number, params: LiveChatMessagesQuery = {}) {
  const { data } = await api.get<LiveChatMessagesResponse>(`/live/sessions/${sessionId}/chat`, {
    params
  });
  return data;
}

export async function sendChatMessage(sessionId: number, payload: LiveChatMessagePayload) {
  const { data } = await api.post<LiveChatMessage>(`/live/sessions/${sessionId}/chat`, payload);
  return data;
}

export async function listSessionBans(sessionId: number) {
  const { data } = await api.get<LiveSessionBan[]>(`/teacher/live/sessions/${sessionId}/bans`);
  return data;
}

export async function banStudent(sessionId: number, payload: LiveSessionBanPayload) {
  const { data } = await api.post<LiveSessionBan>(`/teacher/live/sessions/${sessionId}/ban`, payload);
  return data;
}

export async function unbanStudent(sessionId: number, studentId: number) {
  await api.delete(`/teacher/live/sessions/${sessionId}/ban/${studentId}`);
}

export default {
  listChatMessages,
  sendChatMessage,
  listSessionBans,
  banStudent,
  unbanStudent
};
