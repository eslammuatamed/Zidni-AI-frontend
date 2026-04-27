import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    defaults: { baseURL: '/api' }
  }
}));

import api from '@/services/api';
import { useAuthStore, type AuthUser } from '@/stores/auth';
import { useNotificationStore, type NotificationItem } from '@/stores/notifications';
import { useFeaturesStore, FEATURE } from '@/stores/features';
import type { IMessage } from '@stomp/stompjs';

const apiMock = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  defaults: { baseURL: string };
};

describe('notifications store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  const buildNotification = (overrides?: Partial<NotificationItem>): NotificationItem => ({
    id: overrides?.id ?? 1,
    audience: overrides?.audience ?? 'teacher',
    type: overrides?.type ?? 'system',
    status: overrides?.status ?? 'unread',
    message: overrides?.message ?? 'hello',
    context: overrides?.context ?? '{}',
    createdAt: overrides?.createdAt ?? new Date().toISOString(),
    readAt: overrides?.readAt ?? null,
    studentId: overrides?.studentId ?? null,
    teacherId: overrides?.teacherId ?? 9
  });

  it('fetches teacher notifications and sorts them', async () => {
    const auth = useAuthStore();
    const teacherUser: AuthUser = {
      id: 9,
      roles: ['TEACHER'],
      teacherId: 9
    };
    auth.$patch({ user: teacherUser, initialized: true });
    const features = useFeaturesStore();
    features.loaded = true;
    features.audience = 'secure';
    features.features[FEATURE.notificationsUnified] = true;
    const featureDisabledError = Object.assign(new Error('Feature disabled by plan'), {
      isAxiosError: true,
      response: { status: 403, data: { error: 'Feature disabled by plan' } }
    });
    apiMock.get.mockRejectedValueOnce(featureDisabledError);
    apiMock.get.mockResolvedValueOnce({
      data: [
        buildNotification({ id: 2, message: 'older', createdAt: '2024-01-01T00:00:00Z' }),
        buildNotification({ id: 3, message: 'newer', createdAt: '2024-02-01T00:00:00Z' })
      ]
    });
    const store = useNotificationStore();
    await store.fetchForCurrentUser();
    expect(store.items).toHaveLength(2);
    expect(store.items[0].id).toBe(3);
    expect(apiMock.get).toHaveBeenNthCalledWith(1, '/notifications', {
      params: { audience: 'teacher', page: 0, size: 20 }
    });
    expect(apiMock.get).toHaveBeenNthCalledWith(2, '/v1/teacher/notifications');
  });

  it('uses legacy notifications endpoint when unified feed is disabled', async () => {
    const auth = useAuthStore();
    const studentUser: AuthUser = {
      id: 4,
      roles: ['STUDENT'],
      studentId: 4
    };
    auth.$patch({ user: studentUser, initialized: true });
    const features = useFeaturesStore();
    features.loaded = true;
    features.audience = 'secure';
    features.features[FEATURE.notificationsUnified] = false;
    apiMock.get.mockResolvedValueOnce({
      data: [
        buildNotification({ id: 1, audience: 'student', studentId: 4, message: 'legacy' })
      ]
    });
    const store = useNotificationStore();
    await store.fetchForCurrentUser();
    expect(apiMock.get).toHaveBeenCalledTimes(1);
    expect(apiMock.get).toHaveBeenCalledWith('/v1/students/notifications');
    expect(store.items).toHaveLength(1);
    expect(store.items[0].message).toBe('legacy');
  });

  it('handles websocket payloads locally and updates unread counts', async () => {
    const auth = useAuthStore();
    const teacherUser: AuthUser = {
      id: 5,
      roles: ['TEACHER'],
      teacherId: 5
    };
    auth.$patch({ user: teacherUser, initialized: true });
    const store = useNotificationStore();
    const resolveSpy = vi.spyOn(store, 'resolvePage');
    const message = {
      body: JSON.stringify({
        event: 'created',
        notification: buildNotification({ id: 10, message: 'socket' })
      })
    } as IMessage;
    await store.handleSocket(message);
    expect(store.items[0].id).toBe(10);
    expect(store.totalUnread).toBe(1);
    const updateMessage = {
      body: JSON.stringify({
        event: 'updated',
        notification: buildNotification({ id: 10, status: 'read' })
      })
    } as IMessage;
    await store.handleSocket(updateMessage);
    expect(store.items[0].status).toBe('read');
    expect(store.totalUnread).toBe(0);
    expect(resolveSpy).not.toHaveBeenCalled();
  });

  it('drops socket notifications that do not match current filters', async () => {
    const auth = useAuthStore();
    const teacherUser: AuthUser = {
      id: 8,
      roles: ['TEACHER'],
      teacherId: 8
    };
    auth.$patch({ user: teacherUser, initialized: true });
    const store = useNotificationStore();
    store.lastFilters = { audience: 'teacher', status: 'read' };
    const message = {
      body: JSON.stringify({
        event: 'created',
        notification: buildNotification({ id: 20, status: 'unread' })
      })
    } as IMessage;
    await store.handleSocket(message);
    expect(store.items.find((item) => item.id === 20)).toBeUndefined();
    expect(store.totalUnread).toBe(1);
  });

  it('marks notifications as read via API', async () => {
    const auth = useAuthStore();
    const studentUser: AuthUser = {
      id: 42,
      roles: ['STUDENT'],
      studentId: 42
    };
    auth.$patch({ user: studentUser, initialized: true });
    const store = useNotificationStore();
    store.items = [buildNotification({ id: 7, audience: 'student', studentId: 42 })];
    const featureDisabledError = Object.assign(new Error('Feature disabled by plan'), {
      isAxiosError: true,
      response: { status: 403, data: { code: 'FEATURE_DISABLED_NOTIFICATIONS' } }
    });
    apiMock.patch.mockRejectedValueOnce(featureDisabledError);
    apiMock.patch.mockResolvedValueOnce({ data: buildNotification({ id: 7, status: 'read', audience: 'student' }) });
    await store.markAsRead(7);
    expect(apiMock.patch).toHaveBeenNthCalledWith(1, '/notifications/7/read', undefined, {
      params: { audience: 'student' }
    });
    expect(apiMock.patch).toHaveBeenNthCalledWith(2, '/v1/students/notifications/7/read');
    expect(store.items[0].status).toBe('read');
  });
});
