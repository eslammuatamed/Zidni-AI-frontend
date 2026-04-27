import { describe, expect, it } from 'vitest';

import type { NotificationItem } from '@/api/notifications';
import { parseNotificationContext, resolveNotificationNavigation } from '@/utils/notifications';

const buildNotification = (overrides?: Partial<NotificationItem>): NotificationItem => ({
  id: overrides?.id ?? 1,
  audience: overrides?.audience ?? 'student',
  type: overrides?.type ?? 'system',
  status: overrides?.status ?? 'unread',
  message: overrides?.message ?? 'message',
  context: overrides?.context ?? null,
  createdAt: overrides?.createdAt ?? new Date().toISOString(),
  readAt: overrides?.readAt ?? null,
  studentId: overrides?.studentId ?? null,
  teacherId: overrides?.teacherId ?? null
});

describe('notifications utils', () => {
  it('parses valid context and ignores invalid payloads', () => {
    expect(parseNotificationContext('')).toBeNull();
    expect(parseNotificationContext('{"courseId":5}')).toEqual({ courseId: 5 });
    expect(parseNotificationContext('not-json')).toBeNull();
  });

  it('resolves live session routes for students', () => {
    const notification = buildNotification({
      type: 'live_session',
      context: JSON.stringify({ sessionId: 22 })
    });
    const target = resolveNotificationNavigation(notification);
    expect(target.kind).toBe('route');
    expect(target.location).toEqual({ name: 'student-live-sessions', query: { sessionId: '22' } });
  });

  it('resolves payment routes for teachers', () => {
    const notification = buildNotification({
      audience: 'teacher',
      type: 'payment',
      context: JSON.stringify({ paymentId: 99 })
    });
    const target = resolveNotificationNavigation(notification);
    expect(target.kind).toBe('route');
    expect(target.location).toEqual({ name: 'teacher-payments', query: { paymentId: '99' } });
  });

  it('normalizes teacher audience casing when resolving routes', () => {
    const notification = buildNotification({
      // @ts-expect-error validating runtime casing normalization
      audience: 'TEACHER',
      type: 'payment',
      context: JSON.stringify({ paymentId: 77 })
    });
    const target = resolveNotificationNavigation(notification);
    expect(target.kind).toBe('route');
    expect(target.location).toEqual({ name: 'teacher-payments', query: { paymentId: '77' } });
  });

  it('falls back to teacher routes when teacherId is present', () => {
    const notification = buildNotification({
      // @ts-expect-error validating runtime fallback behaviour
      audience: undefined,
      teacherId: 5,
      type: 'live_session',
      context: JSON.stringify({ sessionId: 42 })
    });
    const target = resolveNotificationNavigation(notification);
    expect(target.kind).toBe('route');
    expect(target.location).toEqual({ name: 'teacher-live-sessions', query: { sessionId: '42' } });
  });

  it('resolves download urls as external targets', () => {
    const notification = buildNotification({ context: JSON.stringify({ downloadUrl: 'https://example.com/file.pdf' }) });
    const target = resolveNotificationNavigation(notification);
    expect(target.kind).toBe('external');
    expect(target.url).toBe('https://example.com/file.pdf');
  });
});
