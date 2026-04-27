import api from '@/services/api';

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface PublicationTeacher {
  id: number;
  name: string;
  slug: string;
  photoUrl?: string | null;
}

export interface PublicationSummary {
  id: number;
  title: string;
  status: 'pending' | 'approved' | 'rejected' | 'unpublished';
  visibility: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  publishedAt?: string | null;
  locale?: string | null;
  thumbnailUrl?: string | null;
  tags: string[];
  sourceKind: string;
}

export interface PublicationDetail extends PublicationSummary {
  description?: string | null;
  videoUrl?: string | null;
  moderationNote?: string | null;
  sourceRef: Record<string, unknown>;
  teacher?: PublicationTeacher | null;
}

export interface TeacherPublicationQuery {
  status?: string;
  q?: string;
  page?: number;
  size?: number;
}

export interface TeacherPublicationPayload {
  sourceKind: string;
  sourceRef: Record<string, unknown>;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  videoUrl?: string | null;
  locale?: string | null;
  tags?: string | null;
}

export interface TeacherPublicationUpdatePayload {
  title?: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  videoUrl?: string | null;
  locale?: string | null;
  tags?: string | null;
  resubmit?: boolean;
}

export interface AdminPublicationQuery {
  status?: string;
  q?: string;
  teacherId?: number;
  teacherSlug?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export interface AdminPublicationSummary {
  publication: PublicationSummary;
  teacher: PublicationTeacher;
}

export interface ModerationPayload {
  note?: string | null;
}

export async function fetchTeacherPublications(params: TeacherPublicationQuery = {}) {
  const { data } = await api.get<PageResponse<PublicationSummary>>('/v1/teacher/syndication/publications', { params });
  return data;
}

export async function createTeacherPublication(payload: TeacherPublicationPayload) {
  const { data } = await api.post<PublicationDetail>('/v1/teacher/syndication/publications', payload);
  return data;
}

export async function fetchTeacherPublication(id: number) {
  const { data } = await api.get<PublicationDetail>(`/v1/teacher/syndication/publications/${id}`);
  return data;
}

export async function updateTeacherPublication(id: number, payload: TeacherPublicationUpdatePayload) {
  const { data } = await api.patch<PublicationDetail>(`/v1/teacher/syndication/publications/${id}`, payload);
  return data;
}

export async function deleteTeacherPublication(id: number) {
  await api.delete(`/v1/teacher/syndication/publications/${id}`);
}

export async function fetchAdminPublications(params: AdminPublicationQuery = {}) {
  const { data } = await api.get<PageResponse<AdminPublicationSummary>>('/v1/platform/syndication/publications', {
    params
  });
  return data;
}

export async function fetchAdminPublication(id: number) {
  const { data } = await api.get<PublicationDetail>(`/v1/platform/syndication/publications/${id}`);
  return data;
}

export async function approvePublication(id: number, payload?: ModerationPayload) {
  const { data } = await api.post<PublicationDetail>(`/v1/platform/syndication/publications/${id}/approve`, payload);
  return data;
}

export async function rejectPublication(id: number, payload: ModerationPayload) {
  const { data } = await api.post<PublicationDetail>(`/api/v1/platform/syndication/publications/${id}/reject`, payload);
  return data;
}

export async function unpublishPublication(id: number, payload?: ModerationPayload) {
  const { data } = await api.post<PublicationDetail>(`/api/v1/platform/syndication/publications/${id}/unpublish`, payload);
  return data;
}

export interface PublicVideoQuery {
  q?: string;
  tag?: string;
  teacherSlug?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export async function fetchPublicVideos(params: PublicVideoQuery = {}) {
  const { data } = await api.get<PageResponse<PublicPublicationListItem>>('/api/platform/catalog/videos', { params });
  return data;
}

export async function fetchPublicVideo(id: number) {
  const { data } = await api.get<PublicationDetail>(`/api/platform/catalog/videos/${id}`);
  return data;
}

export interface PublicPublicationListItem {
  id: number;
  title: string;
  thumbnailUrl?: string | null;
  locale?: string | null;
  tags: string[];
  publishedAt?: string | null;
  teacher: PublicationTeacher;
}
