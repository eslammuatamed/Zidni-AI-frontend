import api from '@/services/api';
import type {
  AssistantAccount,
  AssistantPayload,
  AssistantRole,
  AssistantRolePayload
} from '@/services/teacherAssistants';

export interface TeacherSummary {
  id: number;
  slug: string;
  name: string;
  subject?: string;
  plan: string;
  active: boolean;
}

export interface TeacherSummaryFilters {
  search?: string;
  status?: 'active' | 'disabled';
  plan?: string;
}

export interface CreateTeacherPayload {
  slug: string;
  name: string;
  subject?: string;
  phoneCountryCode: string;
  phoneNumber: string;
  plan?: string;
  email: string;
  password: string;
}

export interface TeacherProfile {
  id: number;
  slug: string;
  name: string;
  subject?: string;
  phoneCountryCode: string;
  phoneNumber: string;
  plan: string;
  bio?: string;
  photoUrl?: string;
  active: boolean;
}

export interface FeatureFlagSummary {
  platformDefaults: Record<string, unknown>;
  planDefaults: Record<string, unknown>;
  overrides: Record<string, unknown>;
  effective: Record<string, unknown>;
}

export interface TeacherEntitlementModules {
  courses: boolean;
  assessments: boolean;
  tutoring: boolean;
  analytics: boolean;
  certifications: boolean;
}

export interface TeacherEntitlements {
  studentLimit: number | null;
  courseLimit: number | null;
  lessonVideoLimit: number | null;
  staffAccountLimit: number | null;
  deviceLimit: number | null;
  activationKeysEnabled: boolean;
  modules: TeacherEntitlementModules;
}

export interface TeacherUsageOverrides {
  storageWarningPercent: number | null;
  storageCriticalPercent: number | null;
  streamingWarningPercent: number | null;
  streamingCriticalPercent: number | null;
  storageGraceDays: number | null;
  streamingGraceDays: number | null;
}

export interface TeacherAccount {
  id: number;
  email: string;
  enabled: boolean;
  lastActivity?: string;
}

export interface TeacherAccountCredentialsPayload {
  email?: string;
  password?: string;
}

export interface TeacherDeviceResponse {
  id: number;
  fingerprint: string;
  active: boolean;
  registeredAt: string;
  lastActiveAt?: string;
}

export interface TeacherDeviceSummary {
  limit: number | null;
  activeCount: number;
  totalCount: number;
  limitReached: boolean;
  nearLimit: boolean;
  devices: TeacherDeviceResponse[];
}

export interface TeacherDomain {
  id: number;
  domain: string;
  verified: boolean;
  verificationToken: string;
  verifiedAt?: string;
  createdAt?: string;
}

export interface TeacherAdmin extends TeacherSummary {
  phoneCountryCode: string;
  phoneNumber: string;
  flags: FeatureFlagSummary;
  entitlements: TeacherEntitlements;
  usageOverrides?: TeacherUsageOverrides | null;
  studentMultiDeviceLoginEnabled: boolean;
  joinDate?: string;
  branding?: Record<string, unknown>;
  bio?: string;
  photoUrl?: string;
  studentCount: number;
  userAccountCount: number;
  deviceCount: number;
  domains: TeacherDomain[];
  deviceSummary: TeacherDeviceSummary;
  accounts: TeacherAccount[];
}

export interface PlatformOverview {
  teacherCount: number;
  activeTeacherCount: number;
  studentCount: number;
  courseCount: number;
  databaseSizeBytes?: number;
  lastBackupAt?: string;
  lastBackupStatus?: string;
}

export interface BackupJob {
  id: number;
  status: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  requestedBy?: string;
  storageUrl?: string;
  storageKey?: string;
  metadata?: Record<string, unknown>;
  errorMessage?: string;
}

export async function fetchTeacherSummaries(filters?: TeacherSummaryFilters): Promise<TeacherSummary[]> {
  const params: Record<string, string> = {};
  if (filters?.search) {
    params.search = filters.search;
  }
  if (filters?.status) {
    params.status = filters.status;
  }
  if (filters?.plan) {
    params.plan = filters.plan;
  }
  const { data } = await api.get<TeacherSummary[]>('/v1/platform/teachers', { params });
  return data;
}

export async function createTeacher(payload: CreateTeacherPayload): Promise<TeacherProfile> {
  const { data } = await api.post<TeacherProfile>('/v1/platform/teachers', payload);
  return data;
}

export async function fetchTeacherDetail(id: number): Promise<TeacherAdmin> {
  const { data } = await api.get<TeacherAdmin>(`/v1/platform/teachers/${id}`);
  return data;
}

export async function updateTeacherLifecycle(
  id: number,
  payload: {
    plan?: string;
    active?: boolean;
    entitlements?: TeacherEntitlements;
    name?: string;
    subject?: string;
    phoneCountryCode?: string;
    phoneNumber?: string;
    studentMultiDeviceLoginEnabled?: boolean;
    usageOverrides?: TeacherUsageOverrides | null;
  }
): Promise<TeacherAdmin> {
  const { data } = await api.put<TeacherAdmin>(`/v1/platform/teachers/${id}`, payload);
  return data;
}

export async function updateTeacherSlug(id: number, slug: string): Promise<TeacherAdmin> {
  const { data } = await api.put<TeacherAdmin>(`/v1/platform/teachers/${id}/slug`, { slug });
  return data;
}

export async function listTeacherDomains(id: number): Promise<TeacherDomain[]> {
  const { data } = await api.get<TeacherDomain[]>(`/v1/platform/teachers/${id}/domains`);
  return data;
}

export async function addTeacherDomain(id: number, domain: string): Promise<TeacherDomain> {
  const { data } = await api.post<TeacherDomain>(`/v1/platform/teachers/${id}/domains`, { domain });
  return data;
}

export async function verifyTeacherDomain(id: number, domainId: number, token: string): Promise<TeacherDomain> {
  const { data } = await api.post<TeacherDomain>(`/v1/platform/teachers/${id}/domains/${domainId}/verify`, {
    token
  });
  return data;
}

export async function removeTeacherDomain(id: number, domainId: number): Promise<void> {
  await api.delete(`/v1/platform/teachers/${id}/domains/${domainId}`);
}

export async function listTeacherDevices(id: number): Promise<TeacherDeviceSummary> {
  const { data } = await api.get<TeacherDeviceSummary>(`/v1/platform/teachers/${id}/devices`);
  return data;
}

export async function recountTeacherDevices(id: number): Promise<TeacherDeviceSummary> {
  const { data } = await api.post<TeacherDeviceSummary>(`/v1/platform/teachers/${id}/devices/recount`);
  return data;
}

export async function disableTeacherDevice(id: number, deviceId: number): Promise<TeacherDeviceSummary> {
  const { data } = await api.post<TeacherDeviceSummary>(
    `/v1/platform/teachers/${id}/devices/${deviceId}/disable`
  );
  return data;
}

export async function listTeacherAccounts(id: number): Promise<TeacherAccount[]> {
  const { data } = await api.get<TeacherAccount[]>(`/v1/platform/teachers/${id}/accounts`);
  return data;
}

export async function updateTeacherAccountStatus(
  teacherId: number,
  accountId: number,
  enabled: boolean
): Promise<TeacherAccount> {
  const { data } = await api.put<TeacherAccount>(
    `/v1/platform/teachers/${teacherId}/accounts/${accountId}`,
    { enabled }
  );
  return data;
}

export async function sendTeacherAccountReset(teacherId: number, accountId: number): Promise<TeacherAccount> {
  const { data } = await api.post<TeacherAccount>(
    `/v1/platform/teachers/${teacherId}/accounts/${accountId}/reset-password`
  );
  return data;
}

export async function createTeacherAccount(
  teacherId: number,
  payload: { email: string; password: string }
): Promise<TeacherAccount> {
  const { data } = await api.post<TeacherAccount>(`/v1/platform/teachers/${teacherId}/accounts`, payload);
  return data;
}

export async function updateTeacherAccount(
  teacherId: number,
  accountId: number,
  payload: TeacherAccountCredentialsPayload
): Promise<TeacherAccount> {
  const { data } = await api.put<TeacherAccount>(
    `/v1/platform/teachers/${teacherId}/accounts/${accountId}/credentials`,
    payload
  );
  return data;
}

export async function deleteTeacherAccount(teacherId: number, accountId: number): Promise<void> {
  await api.delete(`/v1/platform/teachers/${teacherId}/accounts/${accountId}`);
}

export async function listTeacherAssistantRolesAdmin(teacherId: number): Promise<AssistantRole[]> {
  const { data } = await api.get<AssistantRole[]>(`/v1/platform/teachers/${teacherId}/assistants/roles`);
  return data;
}

export async function createTeacherAssistantRoleAdmin(
  teacherId: number,
  payload: AssistantRolePayload
): Promise<AssistantRole> {
  const { data } = await api.post<AssistantRole>(
    `/v1/platform/teachers/${teacherId}/assistants/roles`,
    payload
  );
  return data;
}

export async function updateTeacherAssistantRoleAdmin(
  teacherId: number,
  roleId: number,
  payload: AssistantRolePayload
): Promise<AssistantRole> {
  const { data } = await api.put<AssistantRole>(
    `/v1/platform/teachers/${teacherId}/assistants/roles/${roleId}`,
    payload
  );
  return data;
}

export async function deleteTeacherAssistantRoleAdmin(teacherId: number, roleId: number): Promise<void> {
  await api.delete(`/v1/platform/teachers/${teacherId}/assistants/roles/${roleId}`);
}

export async function listTeacherAssistantsAdmin(teacherId: number): Promise<AssistantAccount[]> {
  const { data } = await api.get<AssistantAccount[]>(`/v1/platform/teachers/${teacherId}/assistants`);
  return data;
}

export async function createTeacherAssistantAdmin(
  teacherId: number,
  payload: AssistantPayload
): Promise<AssistantAccount> {
  const { data } = await api.post<AssistantAccount>(`/v1/platform/teachers/${teacherId}/assistants`, payload);
  return data;
}

export async function updateTeacherAssistantAdmin(
  teacherId: number,
  assistantId: number,
  payload: AssistantPayload
): Promise<AssistantAccount> {
  const { data } = await api.put<AssistantAccount>(
    `/v1/platform/teachers/${teacherId}/assistants/${assistantId}`,
    payload
  );
  return data;
}

export async function deleteTeacherAssistantAdmin(teacherId: number, assistantId: number): Promise<void> {
  await api.delete(`/v1/platform/teachers/${teacherId}/assistants/${assistantId}`);
}

export async function deleteTeacher(id: number): Promise<void> {
  await api.delete(`/v1/platform/teachers/${id}`);
}

export async function fetchOverview(): Promise<PlatformOverview> {
  const { data } = await api.get<PlatformOverview>('/v1/platform/overview');
  return data;
}

export async function fetchBackups(limit = 10): Promise<BackupJob[]> {
  const { data } = await api.get<BackupJob[]>(`/v1/platform/backups`, { params: { limit } });
  return data;
}

export async function triggerBackup(requestedBy?: string): Promise<BackupJob> {
  const payload = requestedBy ? { requestedBy } : {};
  const { data } = await api.post<BackupJob>('/v1/platform/backups', payload);
  return data;
}
