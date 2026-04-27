import api from '@/services/api';

export type BulkItemStatus = 'success' | 'skipped' | 'failed';

export interface BulkOperationItem {
  studentId: number;
  status: BulkItemStatus;
  reason?: string | null;
  extra?: Record<string, unknown> | null;
}

export interface BulkOperationSummary {
  total: number;
  success: number;
  skipped: number;
  failed: number;
}

export interface BulkOperationResult {
  summary: BulkOperationSummary;
  items: BulkOperationItem[];
}

export interface BulkEnrollPayload {
  courseId: number;
  studentIds?: number[];
  groupId?: number | null;
}

export interface BulkRegisterLivePayload {
  sessionId: number;
  studentIds?: number[];
  groupId?: number | null;
}

export type TutoringMode = 'perStudent' | 'pairing';

export interface TutoringPairPayload {
  studentId: number;
  slotId: number;
}

export interface BulkAssignTutoringPayload {
  mode: TutoringMode;
  pairs?: TutoringPairPayload[];
  studentIds?: number[];
  slotIds?: number[];
}

export async function bulkEnrollStudents(payload: BulkEnrollPayload) {
  const { data } = await api.post<BulkOperationResult>('/v1/teacher/bulk/enroll', payload);
  return data;
}

export async function bulkRegisterLiveSessions(payload: BulkRegisterLivePayload) {
  const { data } = await api.post<BulkOperationResult>('/v1/teacher/bulk/register-live', payload);
  return data;
}

export async function bulkAssignTutoring(payload: BulkAssignTutoringPayload) {
  const { data } = await api.post<BulkOperationResult>('/v1/teacher/bulk/assign-tutoring', payload);
  return data;
}
