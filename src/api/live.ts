import api from '@/services/api';


export type LiveSessionProvider = 'zoom' | 'google_meet' | 'teams' | string;
export type LiveSessionStatus = 'scheduled' | 'live' | 'ended' | 'cancelled';
export type LiveSessionRegistrationStatus = 'invited' | 'registered' | 'banned' | 'revoked';
export type LiveSessionRegistrationSource = 'enrollment' | 'manual';

export interface TeacherLiveSession {
  id: number;
  courseId: number;
  courseTitle: string;
  title: string;
  description?: string | null;
  provider: LiveSessionProvider;
  providerConfig?: Record<string, unknown>;
  status: LiveSessionStatus;
  scheduledAt?: string | null;
  durationMinutes: number;
  joinUrl?: string | null;
  registeredCount: number;
  attendedCount: number;
  assistantId?: number | null;
  studentIds?: number[] | null;
  isRecurring?: boolean | null;
}

export interface TeacherLiveSessionsPage {
  items: TeacherLiveSession[];
  total: number;
  page: number;
  size: number;
}

export interface TeacherLiveSessionCreatePayload {
  courseId: number;
  title: string;
  description?: string | null;
  provider: LiveSessionProvider;
  providerConfig?: Record<string, unknown> | null;
  scheduledAt: string;
  durationMinutes: number;
  joinUrl?: string | null;
  assistantId?: number | null;
  studentIds?: number[] | null;
  isRecurring?: boolean;
}

export interface TeacherLiveSessionUpdatePayload {
  title?: string | null;
  description?: string | null;
  provider?: LiveSessionProvider;
  providerConfig?: Record<string, unknown> | null;
  scheduledAt?: string | null;
  durationMinutes?: number | null;
  joinUrl?: string | null;
  assistantId?: number | null;
  studentIds?: number[] | null;
  isRecurring?: boolean;
}

export interface LiveSessionRegistration {
  id: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  status: LiveSessionRegistrationStatus;
  source: LiveSessionRegistrationSource;
  registeredAt?: string | null;
  firstJoinedAt?: string | null;
  lastJoinedAt?: string | null;
  lastLeftAt?: string | null;
  joinCount: number;
  attended: boolean;
}

export interface TeacherAttendanceSummaryRow {
  registrationId: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  joinsCount: number;
  totalSeconds: number;
  firstJoinAt?: string | null;
  lastLeaveAt?: string | null;
}

export interface TeacherAttendanceSummary {
  sessionId: number;
  attendees: TeacherAttendanceSummaryRow[];
}

export interface StudentLiveSession {
  sessionId: number;
  courseId: number;
  courseTitle: string;
  title: string;
  provider: LiveSessionProvider;
  status: LiveSessionStatus;
  registrationStatus: LiveSessionRegistrationStatus;
  scheduledAt?: string | null;
  durationMinutes: number;
  canJoin: boolean;
  joinUrl?: string | null;
  displayJoinUrl?: string | null;
  attended: boolean;
  firstJoinedAt?: string | null;
  lastJoinedAt?: string | null;
  joinCount: number;
}

export interface StudentLiveSessionsPage {
  items: StudentLiveSession[];
  total: number;
  page: number;
  size: number;
}

export interface StudentLiveSessionView {
  sessionId: number;
  courseId: number;
  courseTitle: string;
  sessionTitle: string;
  sessionStatus: LiveSessionStatus;
  registrationStatus: LiveSessionRegistrationStatus;
  canJoin: boolean;
  joinUrl?: string | null;
  scheduledAt?: string | null;
  durationMinutes: number;
  firstJoinedAt?: string | null;
  lastJoinedAt?: string | null;
  lastLeftAt?: string | null;
  joinCount: number;
}

export interface TeacherLiveSessionsQuery {
  courseId?: number;
  from?: string;
  to?: string;
  status?: string;
  page?: number;
  size?: number;
}

export interface StudentLiveSessionsQuery {
  courseId?: number;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export async function listTeacherSessions(query: TeacherLiveSessionsQuery = {}) {
  const { data } = await api.get<TeacherLiveSessionsPage>('/teacher/live/sessions', { params: query });
  return data;
}

export async function createTeacherSession(payload: TeacherLiveSessionCreatePayload) {
  const { data } = await api.post<TeacherLiveSession>('/teacher/live/sessions', payload);
  return data;
}

export async function updateTeacherSession(sessionId: number, payload: TeacherLiveSessionUpdatePayload) {
  const { data } = await api.patch<TeacherLiveSession>(`/teacher/live/sessions/${sessionId}`, payload);
  return data;
}

export async function deleteTeacherSession(sessionId: number) {
  await api.delete(`/teacher/live/sessions/${sessionId}`);
}

export async function getTeacherSession(sessionId: number) {
  const { data } = await api.get<TeacherLiveSession>(`/teacher/live/sessions/${sessionId}`);
  return data;
}

export async function listTeacherRegistrations(sessionId: number) {
  const { data } = await api.get<LiveSessionRegistration[]>(`/teacher/live/sessions/${sessionId}/registrations`);
  return data;
}

export async function summarizeAttendance(sessionId: number) {
  const { data } = await api.post<TeacherAttendanceSummary>(
    `/teacher/live/sessions/${sessionId}/attendance/summarize`
  );
  return data;
}

export async function getAttendanceSummary(sessionId: number) {
  const { data } = await api.get<TeacherAttendanceSummary>(
    `/teacher/live/sessions/${sessionId}/attendance/summary`
  );
  return data;
}

export async function listStudentSessions(query: StudentLiveSessionsQuery = {}) {
  const { data } = await api.get<StudentLiveSessionsPage>('/student/live/sessions', { params: query });
  return data;
}

export async function getStudentSession(sessionId: number) {
  const { data } = await api.get<StudentLiveSessionView>(`/student/live/sessions/${sessionId}`);
  return data;
}

export async function registerForSession(sessionId: number) {
  const { data } = await api.post<StudentLiveSessionView>(`/student/live/sessions/${sessionId}/register`);
  return data;
}

export async function joinSession(sessionId: number) {
  const { data } = await api.post<StudentLiveSessionView>(`/student/live/sessions/${sessionId}/join`);
  return data;
}

export async function leaveSession(sessionId: number) {
  const { data } = await api.post<StudentLiveSessionView>(`/student/live/sessions/${sessionId}/leave`);
  return data;
}

export default {
  listTeacherSessions,
  createTeacherSession,
  updateTeacherSession,
  deleteTeacherSession,
  getTeacherSession,
  listTeacherRegistrations,
  summarizeAttendance,
  getAttendanceSummary,
  listStudentSessions,
  getStudentSession,
  registerForSession,
  joinSession,
  leaveSession
};
