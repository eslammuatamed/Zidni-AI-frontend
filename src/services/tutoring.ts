import api from '@/services/api';
import type { UploadResult } from '@/services/student';

export type TutoringSessionStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type TutoringProvider = 'zoom' | 'meet' | 'google_meet' | 'teams' | 'jitsi' | 'custom' | 'webrtc';
export type ManualPaymentMethod = 'bank' | 'cash' | 'transfer' | 'other';
export type ManualPaymentStatus =
  | 'pending'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'success'
  | 'failed'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUCCESS'
  | 'FAILED';

export interface PagedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export interface AvailabilitySlot {
  id: number;
  startAt: string;
  endAt: string;
  timeZone: string;
  hourlyRate?: number;
  currency?: string | null;
  booked: boolean;
  durationMinutes: number;
}

export interface CreateAvailabilityPayload {
  startAt: string;
  endAt: string;
  timeZone: string;
  hourlyRate?: number;
  currency?: string | null;
}

export interface UpdateAvailabilityPayload {
  startAt?: string;
  endAt?: string;
  timeZone?: string;
  hourlyRate?: number;
  currency?: string | null;
}

export interface AvailabilityQuery {
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export interface SessionQuery {
  status?: TutoringSessionStatus;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export interface TutoringPayment {
  id: number;
  amount: number;
  method: ManualPaymentMethod;
  status: ManualPaymentStatus;
  currency?: string | null;
  proofUrl?: string;
  proofKey?: string;
  notes?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface TutoringSession {
  id: number;
  status: TutoringSessionStatus;
  slot: AvailabilitySlot;
  studentId: number;
  studentName: string;
  studentEmail: string;
  studentNotes?: string;
  teacherNotes?: string;
  provider?: TutoringProvider;
  joinUrl?: string;
  confirmedAt?: string;
  completedAt?: string;
  latestPayment?: TutoringPayment;
  canJoin: boolean;
}

export interface BookSessionPayload {
  slotId: number;
  notes?: string;
}

export interface TutoringPaymentPayload {
  amount: number;
  method: ManualPaymentMethod;
  proofUrl?: string;
  proofKey?: string;
  notes?: string;
}

export interface TutoringPaymentDecisionPayload {
  status: ManualPaymentStatus;
  joinUrl?: string;
  provider?: TutoringProvider;
  notes?: string;
}

export interface TutoringReviewPayload {
  rating?: number;
  comment?: string;
}

export interface ConfirmSessionPayload {
  provider: TutoringProvider;
  joinUrl: string;
}

export interface CancelSessionPayload {
  reason?: string;
}

export interface AvailabilitySlotResponse extends AvailabilitySlot {}

const defaultAvailabilityParams = (params?: AvailabilityQuery) => ({
  page: params?.page ?? 0,
  size: params?.size ?? 20,
  from: params?.from,
  to: params?.to
});

const defaultSessionParams = (params?: SessionQuery) => ({
  page: params?.page ?? 0,
  size: params?.size ?? 20,
  status: params?.status,
  from: params?.from,
  to: params?.to
});

export async function fetchTeacherAvailability(params?: AvailabilityQuery) {
  const { data } = await api.get<PagedResponse<AvailabilitySlot>>('/teacher/availability', {
    params: defaultAvailabilityParams(params)
  });
  return data;
}

export async function createTeacherAvailability(payload: CreateAvailabilityPayload) {
  const { data } = await api.post<AvailabilitySlot>('/teacher/availability', payload);
  return data;
}

export async function updateTeacherAvailability(slotId: number, payload: UpdateAvailabilityPayload) {
  const { data } = await api.patch<AvailabilitySlot>(`/teacher/availability/${slotId}`, payload);
  return data;
}

export async function deleteTeacherAvailability(slotId: number) {
  await api.delete(`/teacher/availability/${slotId}`);
}

export async function fetchTeacherSessions(params?: SessionQuery) {
  const { data } = await api.get<PagedResponse<TutoringSession>>('/teacher/tutoring/sessions', {
    params: defaultSessionParams(params)
  });
  return data;
}

export async function fetchTeacherSession(sessionId: number) {
  const { data } = await api.get<TutoringSession>(`/teacher/tutoring/sessions/${sessionId}`);
  return data;
}

export async function updateTeacherNotes(sessionId: number, notes: string) {
  const { data } = await api.patch<TutoringSession>(`/teacher/tutoring/sessions/${sessionId}/notes`, { notes });
  return data;
}

export async function confirmTeacherSession(sessionId: number, payload: ConfirmSessionPayload) {
  const { data } = await api.patch<TutoringSession>(`/teacher/tutoring/sessions/${sessionId}/confirm`, payload);
  return data;
}

export async function cancelTeacherSession(sessionId: number, payload: CancelSessionPayload) {
  const { data } = await api.patch<TutoringSession>(`/teacher/tutoring/sessions/${sessionId}/cancel`, payload);
  return data;
}

export async function completeTeacherSession(sessionId: number) {
  const { data } = await api.patch<TutoringSession>(`/teacher/tutoring/sessions/${sessionId}/complete`);
  return data;
}

export async function submitTeacherReview(sessionId: number, payload: TutoringReviewPayload) {
  const { data } = await api.post<TutoringSession>(`/teacher/tutoring/sessions/${sessionId}/reviews`, payload);
  return data;
}

export async function fetchTeacherPayments() {
  const { data } = await api.get<TutoringPayment[]>('/teacher/tutoring/payments');
  return data;
}

export async function decideTutoringPayment(paymentId: number, payload: TutoringPaymentDecisionPayload) {
  const { data } = await api.post<TutoringPayment>(`/teacher/tutoring/payments/${paymentId}/decision`, payload);
  return data;
}

export async function fetchStudentAvailability(params?: AvailabilityQuery) {
  const { data } = await api.get<PagedResponse<AvailabilitySlot>>('/api/student/tutoring/availability', {
    params: defaultAvailabilityParams(params)
  });
  return data;
}

export async function bookTutoringSession(payload: BookSessionPayload) {
  const { data } = await api.post<TutoringSession>('/api/student/tutoring/book', payload);
  return data;
}

export async function fetchStudentSessions(params?: SessionQuery) {
  const { data } = await api.get<PagedResponse<TutoringSession>>('/api/student/tutoring/sessions', {
    params: defaultSessionParams(params)
  });
  return data;
}

export async function fetchStudentSession(sessionId: number) {
  const { data } = await api.get<TutoringSession>(`/api/student/tutoring/sessions/${sessionId}`);
  return data;
}

export async function updateStudentNotes(sessionId: number, studentNotes: string) {
  const { data } = await api.patch<TutoringSession>(`/api/student/tutoring/sessions/${sessionId}/notes`, { studentNotes });
  return data;
}

export async function cancelStudentSession(sessionId: number, payload: CancelSessionPayload) {
  const { data } = await api.patch<TutoringSession>(`/api/student/tutoring/sessions/${sessionId}/cancel`, payload);
  return data;
}

export async function submitTutoringPayment(sessionId: number, payload: TutoringPaymentPayload) {
  const { data } = await api.post<TutoringPayment>(`/api/student/tutoring/sessions/${sessionId}/payments`, payload);
  return data;
}

export async function submitTutoringPaymentByBody(payload: TutoringPaymentPayload & { sessionId: number }) {
  const { sessionId, ...rest } = payload;
  const { data } = await api.post<TutoringPayment>('/api/student/tutoring/payments', { sessionId, ...rest });
  return data;
}

export async function uploadTutoringProof(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<UploadResult>('/api/student/tutoring/payments/proof', formData);
  return data;
}

export async function submitStudentReview(sessionId: number, payload: TutoringReviewPayload) {
  const { data } = await api.post<TutoringSession>(`/api/student/tutoring/sessions/${sessionId}/reviews`, payload);
  return data;
}
