import api from '@/services/api';
import type { AuditLogEntry, PageResponse } from '@/adminOps';

export interface TeacherAuditQuery {
  q?: string;
  entityType?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export interface TeacherAuditExportQuery extends TeacherAuditQuery {
  limit?: number;
}

export async function listTeacherAuditLogs(query?: TeacherAuditQuery) {
  const params = {
    q: query?.q,
    entityType: query?.entityType,
    from: query?.from,
    to: query?.to,
    page: query?.page ?? 0,
    size: query?.size ?? 20
  };
  const { data } = await api.get<PageResponse<AuditLogEntry>>('/teacher/audit', { params });
  return data;
}

export async function exportTeacherAuditLogs(query?: TeacherAuditExportQuery) {
  const params = {
    q: query?.q,
    entityType: query?.entityType,
    from: query?.from,
    to: query?.to,
    limit: query?.limit ?? 1000
  };
  const { data } = await api.get<Blob>('/teacher/audit/export', {
    params,
    responseType: 'blob'
  });
  return data;
}

export default {
  listTeacherAuditLogs,
  exportTeacherAuditLogs
};
