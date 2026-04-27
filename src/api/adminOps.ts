import api from '@/services/api';

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface BackupJob {
  id: number;
  status: string;
  requestedBy?: string | null;
  storageUrl?: string | null;
  storageKey?: string | null;
  metadata?: unknown;
  errorMessage?: string | null;
  createdAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface BackupQuery {
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export interface CreateBackupPayload {
  requestedBy?: string;
}

export interface AuditLogEntry {
  id: number;
  actorType?: string | null;
  actorId?: number | null;
  actorName?: string | null;
  action?: string | null;
  entityType?: string | null;
  entityId?: number | null;
  payload?: unknown;
  createdAt?: string | null;
}

export interface AuditQuery {
  q?: string;
  actorType?: string;
  entityType?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export interface AuditExportQuery extends AuditQuery {
  limit?: number;
}

export interface AdminAlertRequest {
  message: string;
  teacherIds?: number[];
}

export interface AdminAlertResponse {
  recipients: number;
}

export async function listBackups(query?: BackupQuery) {
  const params = {
    status: query?.status,
    from: query?.from,
    to: query?.to,
    page: query?.page ?? 0,
    size: query?.size ?? 20
  };
  const { data } = await api.get<PageResponse<BackupJob>>('/admin/backups', { params });
  return data;
}

export async function createBackup(payload?: CreateBackupPayload) {
  const body = payload ?? {};
  const { data } = await api.post<BackupJob>('/admin/backups', body);
  return data;
}

export async function fetchBackup(id: number) {
  const { data } = await api.get<BackupJob>(`/admin/backups/${id}`);
  return data;
}

export async function listAuditLogs(query?: AuditQuery) {
  const params = {
    q: query?.q,
    actorType: query?.actorType,
    entityType: query?.entityType,
    from: query?.from,
    to: query?.to,
    page: query?.page ?? 0,
    size: query?.size ?? 20
  };
  const { data } = await api.get<PageResponse<AuditLogEntry>>('/admin/audit', { params });
  return data;
}

export async function exportAuditLogs(query?: AuditExportQuery) {
  const params = {
    q: query?.q,
    actorType: query?.actorType,
    entityType: query?.entityType,
    from: query?.from,
    to: query?.to,
    limit: query?.limit ?? 1000
  };
  const { data } = await api.get<Blob>('/admin/audit/export', {
    params,
    responseType: 'blob'
  });
  return data;
}

export async function sendAdminAlert(payload: AdminAlertRequest) {
  const body: AdminAlertRequest = {
    message: payload.message,
    ...(payload.teacherIds && payload.teacherIds.length ? { teacherIds: payload.teacherIds } : {})
  };
  const { data } = await api.post<AdminAlertResponse>('/admin/alerts', body);
  return data;
}

export default {
  listBackups,
  createBackup,
  fetchBackup,
  listAuditLogs,
  exportAuditLogs,
  sendAdminAlert
};
