
import api from '@/services/api';
import type { LiveSessionRegistrationStatus } from '@/services/liveSessions';

export interface StudentSummary {
  id: number;
  name: string;
  email: string;
}

export interface RegistrationSessionSummary {
  id: number;
  title: string;
  scheduledAt: string;
  courseId: number;
  courseTitle: string;
}

export interface TeacherRegistrationItem {
  registrationId: number;
  session: RegistrationSessionSummary;
  student: StudentSummary;
  source: string;
  status: LiveSessionRegistrationStatus;
  registeredAt?: string;
  attended: boolean;
  joinCount: number;
  firstJoinedAt?: string;
  lastJoinedAt?: string;
}

export interface PagedResult<T> {
  total: number;
  page: number;
  size: number;
  items: T[];
}

export interface TeacherRegistrationsQuery {
  courseId?: number | null;
  sessionId?: number | null;
  status?: LiveSessionRegistrationStatus | '' | null;
  attended?: boolean | null;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  size?: number;
  sortField?: string;
  sortDesc?: boolean;
}

const buildRegistrationsParams = (query: TeacherRegistrationsQuery, format?: 'csv') => {
  const params: Record<string, unknown> = {};
  const page = Math.max((query.page ?? 1) - 1, 0);
  const size = query.size ?? 25;
  params.page = page;
  params.size = size;

  if (query.courseId) {
    params.courseId = query.courseId;
  }
  if (query.sessionId) {
    params.sessionId = query.sessionId;
  }
  if (query.status) {
    params.status = query.status;
  }
  if (typeof query.attended === 'boolean') {
    params.attended = query.attended;
  }
  if (query.search && query.search.trim().length > 0) {
    params.q = query.search.trim();
  }
  if (query.dateFrom) {
    params.dateFrom = query.dateFrom;
  }
  if (query.dateTo) {
    params.dateTo = query.dateTo;
  }
  const sortField = query.sortField || 'registeredAt';
  const sortOrder = query.sortDesc === false ? 'asc' : 'desc';
  params.sort = `${sortField},${sortOrder}`;
  if (format) {
    params.format = format;
  }
  return params;
};

export async function fetchTeacherRegistrations(query: TeacherRegistrationsQuery) {
  const params = buildRegistrationsParams(query);
  const { data } = await api.get<PagedResult<TeacherRegistrationItem>>('/teacher/registrations', { params });
  return data;
}

export async function exportTeacherRegistrationsCsv(query: TeacherRegistrationsQuery) {
  const params = buildRegistrationsParams(query, 'csv');
  const { data } = await api.get('/teacher/registrations', {
    params,
    responseType: 'blob',
    headers: {
      Accept: 'text/csv'
    }
  });
  return data as Blob;
}
