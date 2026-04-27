import api from '@/services/api';

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AdminStudentTeacher {
  id: number;
  name: string;
  slug: string;
  plan: string;
}

export interface AdminStudentSummary {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  status: string;
  joinedAt?: string | null;
  verifiedAt?: string | null;
  primaryTeacher?: AdminStudentTeacher | null;
  linkCount: number;
  deviceRegistered?: boolean;
  deviceDisabled?: boolean;
  deviceLastSeen?: string | null;
}

export interface PlanQuota {
  plan: string;
  maxActiveStudents?: number | null;
  activeStudents: number;
  totalStudents: number;
  limitReached: boolean;
}

export interface AdminStudentLink {
  teacherId?: number | null;
  teacherName?: string | null;
  teacherSlug?: string | null;
  primary: boolean;
  status: string;
  createdAt?: string | null;
  quota?: PlanQuota | null;
}

export interface AdminStudentDetail extends AdminStudentSummary {
  links: AdminStudentLink[];
}

export interface StudentListParams {
  status?: string;
  teacherId?: number;
  q?: string;
  page?: number;
  size?: number;
}

export interface AdminStudentLinkPayload {
  teacherId: number;
  status?: string;
  primary?: boolean;
}

export async function fetchAdminStudents(params: StudentListParams = {}) {
  const query: Record<string, unknown> = {};
  if (params.status) query.status = params.status;
  if (params.teacherId != null) query.teacherId = params.teacherId;
  if (params.q) query.q = params.q;
  if (params.page != null) query.page = params.page;
  if (params.size != null) query.size = params.size;

  const { data } = await api.get<PageResponse<AdminStudentSummary>>('/api/v1/platform/students', {
    params: query
  });
  return data;
}

export async function fetchAdminStudentDetail(id: number) {
  const { data } = await api.get<AdminStudentDetail>(`/api/v1/platform/students/${id}`);
  return data;
}

export async function updateAdminStudentStatus(id: number, status: string) {
  const { data } = await api.put<AdminStudentDetail>(`/api/v1/platform/students/${id}/status`, { status });
  return data;
}

export async function upsertAdminStudentLink(id: number, payload: AdminStudentLinkPayload) {
  const { data } = await api.post<AdminStudentDetail>(`/api/v1/platform/students/${id}/links`, payload);
  return data;
}

export async function removeAdminStudentLink(id: number, teacherId: number) {
  const { data } = await api.delete<AdminStudentDetail>(`/api/v1/platform/students/${id}/links/${teacherId}`);
  return data;
}

export async function disableAdminStudentDevice(id: number) {
  const { data } = await api.post<AdminStudentDetail>(`/api/v1/platform/students/${id}/device/disable`);
  return data;
}

export async function enableAdminStudentDevice(id: number) {
  const { data } = await api.post<AdminStudentDetail>(`/api/v1/platform/students/${id}/device/enable`);
  return data;
}

export async function resetAdminStudentDevice(id: number) {
  const { data } = await api.post<AdminStudentDetail>(`/api/v1/platform/students/${id}/device/reset`);
  return data;
}
