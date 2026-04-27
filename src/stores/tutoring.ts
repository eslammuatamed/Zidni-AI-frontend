import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';
import type {
  AvailabilityQuery,
  AvailabilitySlot,
  BookSessionPayload,
  CancelSessionPayload,
  ConfirmSessionPayload,
  CreateAvailabilityPayload,
  PagedResponse,
  SessionQuery,
  TutoringPayment,
  TutoringPaymentDecisionPayload,
  TutoringPaymentPayload,
  TutoringReviewPayload,
  TutoringSession,
  UpdateAvailabilityPayload
} from '@/services/tutoring';
import {
  bookTutoringSession,
  cancelStudentSession,
  cancelTeacherSession,
  completeTeacherSession,
  confirmTeacherSession,
  createTeacherAvailability,
  decideTutoringPayment,
  deleteTeacherAvailability,
  fetchStudentAvailability,
  fetchStudentSessions,
  fetchTeacherAvailability,
  fetchTeacherSessions,
  fetchTeacherPayments,
  submitStudentReview,
  submitTeacherReview,
  submitTutoringPayment,
  submitTutoringPaymentByBody,
  updateStudentNotes,
  updateTeacherAvailability,
  updateTeacherNotes,
  fetchStudentSession as loadStudentSessionApi,
  uploadTutoringProof,
  fetchTeacherSession as loadTeacherSessionApi
} from '@/services/tutoring';
import type { UploadResult } from '@/services/student';

export type TutoringError = 'network' | 'unauthorized' | 'forbidden' | 'server' | 'not-found';

function mapError(status?: number): TutoringError {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not-found';
  if (status && status >= 500) return 'server';
  return 'network';
}

interface PagedState<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

function emptyPagedState<T>(): PagedState<T> {
  // Cast items through unknown to satisfy reactive unwrap typing
  return reactive({ items: [] as unknown as T[], total: 0, page: 0, size: 0 }) as PagedState<T>;
}

export const useTutoringStore = defineStore('tutoring', () => {
  const teacherAvailability = emptyPagedState<AvailabilitySlot>();
  const teacherSessions = emptyPagedState<TutoringSession>();
  const teacherPayments = ref<TutoringPayment[]>([]);
  const teacherSelectedSession = ref<TutoringSession | null>(null);
  const studentAvailability = emptyPagedState<AvailabilitySlot>();
  const studentSessions = emptyPagedState<TutoringSession>();
  const studentSelectedSession = ref<TutoringSession | null>(null);
  const proofUploadResult = ref<UploadResult | null>(null);
  const loading = ref(false);
  const error = ref<TutoringError | null>(null);

  let lastTeacherAvailabilityQuery: AvailabilityQuery | undefined;
  let lastTeacherSessionsQuery: SessionQuery | undefined;
  let lastStudentAvailabilityQuery: AvailabilityQuery | undefined;
  let lastStudentSessionsQuery: SessionQuery | undefined;

  function assignPagedState<T>(state: PagedState<T>, result: PagedResponse<T>) {
    state.items = result.items;
    state.total = result.total;
    state.page = result.page;
    state.size = result.size;
  }

  async function loadTeacherAvailability(params?: AvailabilityQuery) {
    loading.value = true;
    error.value = null;
    try {
      const data = await fetchTeacherAvailability(params);
      assignPagedState(teacherAvailability, data);
      lastTeacherAvailabilityQuery = { ...params, page: data.page, size: data.size };
    } catch (err: any) {
      const status = err?.response?.status as number | undefined;
      error.value = mapError(status);
      assignPagedState(teacherAvailability, { items: [], total: 0, page: 0, size: params?.size ?? 0 });
    } finally {
      loading.value = false;
    }
  }

  async function addAvailability(payload: CreateAvailabilityPayload) {
    await createTeacherAvailability(payload);
    await loadTeacherAvailability(lastTeacherAvailabilityQuery);
  }

  async function editAvailability(slotId: number, payload: UpdateAvailabilityPayload) {
    await updateTeacherAvailability(slotId, payload);
    await loadTeacherAvailability(lastTeacherAvailabilityQuery);
  }

  async function removeAvailability(slotId: number) {
    await deleteTeacherAvailability(slotId);
    await loadTeacherAvailability(lastTeacherAvailabilityQuery);
  }

  async function loadTeacherSessions(params?: SessionQuery) {
    loading.value = true;
    error.value = null;
    try {
      const data = await fetchTeacherSessions(params);
      assignPagedState(teacherSessions, data);
      lastTeacherSessionsQuery = { ...params, page: data.page, size: data.size };
    } catch (err: any) {
      const status = err?.response?.status as number | undefined;
      error.value = mapError(status);
      assignPagedState(teacherSessions, { items: [], total: 0, page: 0, size: params?.size ?? 0 });
    } finally {
      loading.value = false;
    }
  }

  async function loadTeacherSession(sessionId: number) {
    teacherSelectedSession.value = await loadTeacherSessionApi(sessionId);
    return teacherSelectedSession.value;
  }

  async function saveTeacherNotes(sessionId: number, notes: string) {
    const session = await updateTeacherNotes(sessionId, notes);
    teacherSelectedSession.value = session;
    await loadTeacherSessions(lastTeacherSessionsQuery);
    return session;
  }

  async function markSessionComplete(sessionId: number) {
    const session = await completeTeacherSession(sessionId);
    teacherSelectedSession.value = session;
    await loadTeacherSessions(lastTeacherSessionsQuery);
    return session;
  }

  async function confirmSession(sessionId: number, payload: ConfirmSessionPayload) {
    const session = await confirmTeacherSession(sessionId, payload);
    teacherSelectedSession.value = session;
    await loadTeacherSessions(lastTeacherSessionsQuery);
    return session;
  }

  async function cancelSession(sessionId: number, payload: CancelSessionPayload) {
    const session = await cancelTeacherSession(sessionId, payload);
    teacherSelectedSession.value = session;
    await loadTeacherSessions(lastTeacherSessionsQuery);
    await loadTeacherAvailability(lastTeacherAvailabilityQuery);
    return session;
  }

  async function leaveTeacherReview(sessionId: number, payload: TutoringReviewPayload) {
    const session = await submitTeacherReview(sessionId, payload);
    teacherSelectedSession.value = session;
    await loadTeacherSessions(lastTeacherSessionsQuery);
    return session;
  }

  async function loadTeacherPayments() {
    teacherPayments.value = await fetchTeacherPayments();
  }

  async function decidePayment(paymentId: number, payload: TutoringPaymentDecisionPayload) {
    const payment = await decideTutoringPayment(paymentId, payload);
    await loadTeacherPayments();
    await loadTeacherSessions(lastTeacherSessionsQuery);
    return payment;
  }

  async function loadStudentAvailability(params?: AvailabilityQuery) {
    const data = await fetchStudentAvailability(params);
    assignPagedState(studentAvailability, data);
    lastStudentAvailabilityQuery = { ...params, page: data.page, size: data.size };
  }

  async function bookSession(payload: BookSessionPayload) {
    const session = await bookTutoringSession(payload);
    await loadStudentAvailability(lastStudentAvailabilityQuery);
    await loadStudentSessions(lastStudentSessionsQuery);
    return session;
  }

  async function loadStudentSessions(params?: SessionQuery) {
    const data = await fetchStudentSessions(params);
    assignPagedState(studentSessions, data);
    lastStudentSessionsQuery = { ...params, page: data.page, size: data.size };
  }

  async function loadStudentSession(sessionId: number) {
    studentSelectedSession.value = await loadStudentSessionApi(sessionId);
    return studentSelectedSession.value;
  }

  async function saveStudentNotes(sessionId: number, notes: string) {
    const session = await updateStudentNotes(sessionId, notes);
    studentSelectedSession.value = session;
    await loadStudentSessions(lastStudentSessionsQuery);
    return session;
  }

  async function cancelStudentBooking(sessionId: number, payload: CancelSessionPayload) {
    const session = await cancelStudentSession(sessionId, payload);
    studentSelectedSession.value = session;
    await loadStudentSessions(lastStudentSessionsQuery);
    await loadStudentAvailability(lastStudentAvailabilityQuery);
    return session;
  }

  async function submitPayment(sessionId: number, payload: TutoringPaymentPayload) {
    const payment = await submitTutoringPayment(sessionId, payload);
    await loadStudentSession(sessionId);
    return payment;
  }

  async function submitPaymentWithBody(payload: TutoringPaymentPayload & { sessionId: number }) {
    const payment = await submitTutoringPaymentByBody(payload);
    await loadStudentSession(payload.sessionId);
    return payment;
  }

  async function uploadProof(file: File) {
    proofUploadResult.value = await uploadTutoringProof(file);
    return proofUploadResult.value;
  }

  async function leaveStudentReview(sessionId: number, payload: TutoringReviewPayload) {
    const session = await submitStudentReview(sessionId, payload);
    studentSelectedSession.value = session;
    await loadStudentSessions(lastStudentSessionsQuery);
    return session;
  }

  function clear() {
    assignPagedState(teacherAvailability, { items: [], total: 0, page: 0, size: 0 });
    assignPagedState(teacherSessions, { items: [], total: 0, page: 0, size: 0 });
    teacherPayments.value = [];
    teacherSelectedSession.value = null;
    assignPagedState(studentAvailability, { items: [], total: 0, page: 0, size: 0 });
    assignPagedState(studentSessions, { items: [], total: 0, page: 0, size: 0 });
    studentSelectedSession.value = null;
    proofUploadResult.value = null;
    error.value = null;
  }

  return {
    teacherAvailability,
    teacherSessions,
    teacherPayments,
    teacherSelectedSession,
    studentAvailability,
    studentSessions,
    studentSelectedSession,
    proofUploadResult,
    loading,
    error,
    loadTeacherAvailability,
    addAvailability,
    editAvailability,
    removeAvailability,
    loadTeacherSessions,
    loadTeacherSession,
    saveTeacherNotes,
    markSessionComplete,
    confirmSession,
    cancelSession,
    leaveTeacherReview,
    loadTeacherPayments,
    decidePayment,
    loadStudentAvailability,
    bookSession,
    loadStudentSessions,
    loadStudentSession,
    saveStudentNotes,
    cancelStudentBooking,
    submitPayment,
    submitPaymentWithBody,
    uploadProof,
    leaveStudentReview,
    clear
  };
});
