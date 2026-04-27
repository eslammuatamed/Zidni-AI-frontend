import api from '@/services/api';

export type AssistantStatus = 'ACTIVE' | 'INACTIVE' | 'DISABLED' | 'PENDING';

export interface AssistantRole {
  id: number;
  name: string;
  persona?: string | null;
  description?: string | null;
  permissions: string[];
  assistantCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssistantRolePayload {
  name: string;
  persona?: string | null;
  description?: string | null;
  permissions: string[];
}

export interface AssistantAccount {
  id: number;
  name: string;
  email: string;
  username: string;
  roleId: number | null;
  role?: AssistantRole | null;
  status?: AssistantStatus | string | null;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssistantPayload {
  name: string;
  email: string;
  username: string;
  password?: string;
  roleId?: number | null;
}

export interface AssistantPersonaInsight {
  persona: string | null;
  roleCount: number;
  assistantCount: number;
}

export interface AssistantCoverageInsight {
  area: string;
  covered: boolean;
  roleCount: number;
  assistantCount: number;
}

export interface AssistantAutomationInsight {
  persona: string | null;
  templateName: string;
  checklist: string[];
  slaMinutes: number;
  reminderChannels: string[];
  calendarSyncEnabled: boolean;
  activeAssistants: number;
  pendingAssistants: number;
  backlogTasks: number;
  nextRebalanceMinutes: number;
}

export interface AssistantCollaborationInsight {
  persona: string | null;
  activeThreads: number;
  mentionsLastWeek: number;
  auditEvents: number;
  presence: string[];
  realtimePresenceEnabled: boolean;
  notesEnabled: boolean;
}

export type AssistantPerformanceTrend = 'UP' | 'DOWN' | 'FLAT';

export interface AssistantPerformanceInsight {
  persona: string | null;
  baselineScore: number;
  currentScore: number;
  deltaPercentage: number;
  trend: AssistantPerformanceTrend;
  coachingRecommended: boolean;
  completedTasks: number;
  overdueTasks: number;
  utilization: number;
}

export interface AssistantInsights {
  personas: AssistantPersonaInsight[];
  coverage: AssistantCoverageInsight[];
  automation: AssistantAutomationInsight[];
  collaboration: AssistantCollaborationInsight[];
  performance: AssistantPerformanceInsight[];
}

export async function fetchAssistantRoles() {
  const { data } = await api.get<AssistantRole[]>('/api/v1/teacher/assistants/roles');
  return data;
}

export async function createAssistantRole(payload: AssistantRolePayload) {
  const { data } = await api.post<AssistantRole>('/api/v1/teacher/assistants/roles', payload);
  return data;
}

export async function updateAssistantRole(roleId: number, payload: AssistantRolePayload) {
  const { data } = await api.put<AssistantRole>(`/api/v1/teacher/assistants/roles/${roleId}`, payload);
  return data;
}

export async function deleteAssistantRole(roleId: number) {
  await api.delete(`/api/v1/teacher/assistants/roles/${roleId}`);
}

export async function fetchAssistants() {
  const { data } = await api.get<AssistantAccount[]>('/api/v1/teacher/assistants');
  return data;
}

export async function createAssistant(payload: AssistantPayload) {
  const { data } = await api.post<AssistantAccount>('/api/v1/teacher/assistants', payload);
  return data;
}

export async function updateAssistant(assistantId: number, payload: AssistantPayload) {
  const { data } = await api.put<AssistantAccount>(`/api/v1/teacher/assistants/${assistantId}`, payload);
  return data;
}

export async function deleteAssistant(assistantId: number) {
  await api.delete(`/api/v1/teacher/assistants/${assistantId}`);
}

export async function fetchAssistantInsights() {
  const { data } = await api.get<AssistantInsights>('/api/v1/teacher/assistants/insights');
  return data;
}
