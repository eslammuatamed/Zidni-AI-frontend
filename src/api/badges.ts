import api from '@/services/api';

export type BadgeRuleType = 'COURSE_COMPLETIONS';

export interface BadgeRulePayload {
  type: BadgeRuleType;
  threshold: number;
}

export interface TeacherBadge {
  id: number;
  name: string;
  iconUrl?: string | null;
  description?: string | null;
  rule: BadgeRulePayload;
}

export interface TeacherBadgePage {
  items: TeacherBadge[];
  total: number;
  page: number;
  size: number;
}

export interface BadgeAssignment {
  id: number;
  badgeId: number;
  studentId: number;
  studentName?: string | null;
  studentEmail?: string | null;
  earnedAt: string;
  metadata?: string | null;
}

export interface BadgeAssignmentsPage {
  items: BadgeAssignment[];
  total: number;
  page: number;
  size: number;
}

export interface StudentBadgeItem {
  id: number;
  badgeId: number;
  name: string;
  iconUrl?: string | null;
  description?: string | null;
  earnedAt: string;
  metadata?: string | null;
}

export interface TeacherBadgeCreatePayload {
  name: string;
  iconUrl?: string | null;
  description?: string | null;
  rule: BadgeRulePayload;
}

export interface TeacherBadgeUpdatePayload {
  name?: string;
  iconUrl?: string | null;
  description?: string | null;
  rule?: BadgeRulePayload;
}

export interface AwardBadgePayload {
  studentId: number;
  metadata?: string | null;
}

export interface UploadBadgeIconResponse {
  url: string;
  key: string;
}

export interface PaginationQuery {
  page?: number;
  size?: number;
}

const defaultPageParams = (query?: PaginationQuery) => ({
  page: query?.page ?? 0,
  size: query?.size ?? 20
});

export async function listTeacherBadges(query?: PaginationQuery) {
  const params = defaultPageParams(query);
  const { data } = await api.get<TeacherBadgePage>('/teacher/badges', { params });
  return data;
}

export async function createTeacherBadge(payload: TeacherBadgeCreatePayload) {
  const { data } = await api.post<TeacherBadge>('/teacher/badges', payload);
  return data;
}

export async function updateTeacherBadge(id: number, payload: TeacherBadgeUpdatePayload) {
  const { data } = await api.patch<TeacherBadge>(`/teacher/badges/${id}`, payload);
  return data;
}

export async function deleteTeacherBadge(id: number) {
  await api.delete(`/teacher/badges/${id}`);
}

export async function listBadgeAssignments(badgeId: number, query?: PaginationQuery) {
  const params = defaultPageParams(query);
  const { data } = await api.get<BadgeAssignmentsPage>(`/teacher/badges/${badgeId}/awards`, { params });
  return data;
}

export async function awardBadge(badgeId: number, payload: AwardBadgePayload) {
  const { data } = await api.post<BadgeAssignment>(`/teacher/badges/${badgeId}/award`, payload);
  return data;
}

export async function revokeBadge(badgeId: number, studentId: number) {
  await api.delete(`/teacher/badges/${badgeId}/award/${studentId}`);
}

export async function uploadBadgeIcon(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<UploadBadgeIconResponse>('/teacher/badges/icon', formData);
  return data;
}

export async function listStudentBadges() {
  const { data } = await api.get<StudentBadgeItem[]>('/student/badges');
  return data;
}

export default {
  listTeacherBadges,
  createTeacherBadge,
  updateTeacherBadge,
  deleteTeacherBadge,
  listBadgeAssignments,
  awardBadge,
  revokeBadge,
  uploadBadgeIcon,
  listStudentBadges
};
