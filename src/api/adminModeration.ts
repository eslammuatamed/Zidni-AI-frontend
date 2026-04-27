import api from '@/services/api';

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CourseModerationSummary {
  id: number;
  title: string;
  type: string;
  price: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  deleted: boolean;
  teacherName?: string | null;
  teacherSlug?: string | null;
}

export interface CourseModerationDetail {
  id: number;
  title: string;
  type: string;
  price: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  deleted: boolean;
  description?: string | null;
  level?: string | null;
  language?: string | null;
  moduleCount: number;
  lessonCount: number;
  teacher?: {
    id: number;
    name: string;
    slug: string;
    plan: string;
    active: boolean;
  } | null;
}

export interface CourseModerationQuery {
  teacherSlug?: string;
  status?: 'active' | 'inactive';
  q?: string;
  page?: number;
  size?: number;
  includeDeleted?: boolean;
}

export async function listAdminCourses(query?: CourseModerationQuery) {
  const params = {
    teacherSlug: query?.teacherSlug,
    status: query?.status,
    q: query?.q,
    page: query?.page ?? 0,
    size: query?.size ?? 20,
    includeDeleted: query?.includeDeleted ?? false
  };
  const { data } = await api.get<PageResponse<CourseModerationSummary>>('/admin/courses', { params });
  return data;
}

export async function fetchAdminCourse(id: number) {
  const { data } = await api.get<CourseModerationDetail>(`/admin/courses/${id}`);
  return data;
}

export async function approveAdminCourse(id: number) {
  const { data } = await api.patch<CourseModerationDetail>(`/admin/courses/${id}/approve`);
  return data;
}

export async function disableAdminCourse(id: number) {
  const { data } = await api.patch<CourseModerationDetail>(`/admin/courses/${id}/disable`);
  return data;
}

export async function restoreAdminCourse(id: number) {
  const { data } = await api.post<CourseModerationDetail>(`/admin/courses/${id}/restore`);
  return data;
}

export default {
  listAdminCourses,
  fetchAdminCourse,
  approveAdminCourse,
  disableAdminCourse,
  restoreAdminCourse
};
