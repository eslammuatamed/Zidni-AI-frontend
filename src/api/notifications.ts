import api from '@/services/api';

export type NotificationAudience = 'student' | 'teacher';
export type NotificationType = 'course' | 'payment' | 'exam' | 'live_session' | 'tutoring' | 'system';
export type NotificationStatus = 'unread' | 'read';

export interface NotificationItem {
  id: number;
  audience: NotificationAudience;
  type: NotificationType;
  status: NotificationStatus;
  message: string;
  context?: string | null;
  createdAt: string;
  readAt?: string | null;
  studentId?: number | null;
  teacherId?: number | null;
}

export interface NotificationPageResponse {
  items: NotificationItem[];
  total: number;
  page: number;
  size: number;
  unreadCount: number;
}

export interface NotificationFilters {
  audience: NotificationAudience;
  type?: NotificationType | 'all';
  status?: NotificationStatus | 'all';
  from?: string;
  to?: string;
  teacherId?: number;
  page?: number;
  size?: number;
}

const normalizeFilters = (filters: NotificationFilters) => {
  const params: Record<string, unknown> = {
    audience: filters.audience,
    page: filters.page ?? 0,
    size: filters.size ?? 20
  };
  if (filters.type && filters.type !== 'all') {
    params.type = filters.type;
  }
  if (filters.status && filters.status !== 'all') {
    params.status = filters.status;
  }
  if (filters.from) {
    params.from = filters.from;
  }
  if (filters.to) {
    params.to = filters.to;
  }
  if (typeof filters.teacherId === 'number') {
    params.teacherId = filters.teacherId;
  }
  return params;
};

export async function listNotifications(filters: NotificationFilters) {
  const params = normalizeFilters(filters);
  const { data } = await api.get<NotificationPageResponse>('/notifications', { params });
  return data;
}

export async function markNotificationRead(id: number, audience?: NotificationAudience) {
  const params: Record<string, string> = {};
  if (audience) {
    params.audience = audience;
  }
  const { data } = await api.patch<NotificationItem>(`/notifications/${id}/read`, undefined, { params });
  return data;
}

export default {
  listNotifications,
  markNotificationRead
};
