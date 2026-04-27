import api from '@/services/api';

export interface PagedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export interface StudentListItem {
  studentId: number;
  name: string;
  email: string;
  status: string;
  joinedAt: string;
  deviceRegistered: boolean;
  deviceDisabled: boolean;
  deviceLastSeen?: string | null;
}

export interface GroupDto {
  id: number;
  name: string;
  description?: string | null;
  capacity?: number | null;
  membersCount: number;
  createdAt: string;
}

export interface GroupMemberDto {
  studentId: number;
  name: string;
  email: string;
  joinedAt: string;
}

export interface StudentQuery {
  search?: string;
  status?: string;
  page?: number;
  size?: number;
}

export interface GroupQuery {
  q?: string;
  page?: number;
  size?: number;
}

export interface MemberQuery {
  q?: string;
  page?: number;
  size?: number;
}

export interface CreateGroupPayload {
  name: string;
  description?: string | null;
  capacity?: number | null;
}

export interface UpdateGroupPayload {
  name?: string;
  description?: string | null;
  capacity?: number | null;
}

export interface AddMembersPayload {
  studentIds: number[];
}

export async function fetchTeacherStudents(params: StudentQuery = {}) {
  const { data } = await api.get<PagedResponse<StudentListItem>>('/v1/teacher/students', {
    params
  });
  return data;
}

export async function disableTeacherStudentDevice(studentId: number) {
  const { data } = await api.post<StudentListItem>(`/v1/teacher/students/${studentId}/device/disable`);
  return data;
}

export async function enableTeacherStudentDevice(studentId: number) {
  const { data } = await api.post<StudentListItem>(`/v1/teacher/students/${studentId}/device/enable`);
  return data;
}

export async function resetTeacherStudentDevice(studentId: number) {
  const { data } = await api.post<StudentListItem>(`/v1/teacher/students/${studentId}/device/reset`);
  return data;
}

export async function fetchTeacherGroups(params: GroupQuery = {}) {
  const { data } = await api.get<PagedResponse<GroupDto>>('/v1/teacher/groups', {
    params
  });
  return data;
}

export async function createTeacherGroup(payload: CreateGroupPayload) {
  const { data } = await api.post<GroupDto>('/v1/teacher/groups', payload);
  return data;
}

export async function updateTeacherGroup(groupId: number, payload: UpdateGroupPayload) {
  const { data } = await api.patch<GroupDto>(`/v1/teacher/groups/${groupId}`, payload);
  return data;
}

export async function deleteTeacherGroup(groupId: number) {
  await api.delete(`/v1/teacher/groups/${groupId}`);
}

export async function fetchGroupMembers(groupId: number, params: MemberQuery = {}) {
  const { data } = await api.get<PagedResponse<GroupMemberDto>>(`/v1/teacher/groups/${groupId}/members`, {
    params
  });
  return data;
}

export async function addGroupMembers(groupId: number, payload: AddMembersPayload) {
  const { data } = await api.post<GroupMemberDto[]>(`/v1/teacher/groups/${groupId}/members`, payload);
  return data;
}

export async function removeGroupMember(groupId: number, studentId: number) {
  await api.delete(`/v1/teacher/groups/${groupId}/members/${studentId}`);
}
