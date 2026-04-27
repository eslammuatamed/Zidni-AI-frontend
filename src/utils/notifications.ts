import type { NotificationAudience, NotificationItem } from '@/api/notifications';
import type { RouteLocationRaw } from 'vue-router';

export interface NotificationNavigation {
  kind: 'route' | 'external' | 'none';
  location?: RouteLocationRaw;
  url?: string;
}

type NotificationContext = Record<string, unknown> | null;

const numberValue = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const stringValue = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }
  return undefined;
};

export const parseNotificationContext = (context?: string | null): NotificationContext => {
  if (!context) return null;
  try {
    const parsed = JSON.parse(context) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch (error) {
    console.warn('[notifications] failed to parse context', error);
  }
  return null;
};

const normalizeAudience = (
  audience: NotificationItem['audience'] | string | null | undefined
): NotificationAudience | undefined => {
  if (!audience) return undefined;
  const value = String(audience).trim().toLowerCase();
  if (value === 'teacher' || value === 'student') {
    return value;
  }
  return undefined;
};

const isTeacherNotification = (item: NotificationItem): boolean => {
  const normalizedAudience = normalizeAudience(item.audience);
  if (normalizedAudience) {
    return normalizedAudience === 'teacher';
  }
  if (typeof item.teacherId === 'number' && Number.isFinite(item.teacherId)) {
    return true;
  }
  if (typeof item.studentId === 'number' && Number.isFinite(item.studentId)) {
    return false;
  }
  return false;
};

export const resolveNotificationNavigation = (item: NotificationItem): NotificationNavigation => {
  const context = parseNotificationContext(item.context);
  if (context) {
    const downloadUrl = stringValue(context.downloadUrl ?? context.url);
    if (downloadUrl) {
      return { kind: 'external', url: downloadUrl };
    }
  }

  const courseId = numberValue(context?.courseId);
  const sessionId = numberValue(context?.sessionId);
  const assessmentId = numberValue(context?.assessmentId);
  const attemptId = numberValue(context?.attemptId);
  const reportId = numberValue(context?.reportId);
  const paymentId = numberValue(context?.paymentId);

  const isTeacherAudience = isTeacherNotification(item);

  if (item.type === 'live_session' && sessionId) {
    if (isTeacherAudience) {
      return {
        kind: 'route',
        location: { name: 'teacher-live-sessions', query: { sessionId: String(sessionId) } }
      };
    }
    return {
      kind: 'route',
      location: { name: 'student-live-sessions', query: { sessionId: String(sessionId) } }
    };
  }

  if (item.type === 'payment' && courseId) {
    if (isTeacherAudience) {
      return {
        kind: 'route',
        location: { name: 'teacher-learning', query: { courseId: String(courseId) } }
      };
    }
    return {
      kind: 'route',
      location: { name: 'student-learning', query: { courseId: String(courseId) } }
    };
  }

  if (item.type === 'exam' && assessmentId) {
    if (isTeacherAudience) {
      if (attemptId) {
        return {
          kind: 'route',
          location: {
            name: 'teacher-assessment-attempts',
            params: { assessmentId: String(assessmentId) },
            query: { attemptId: String(attemptId) }
          }
        };
      }
      return {
        kind: 'route',
        location: { name: 'teacher-assessment-builder', params: { assessmentId: String(assessmentId) } }
      };
    }
    return {
      kind: 'route',
      location: { name: 'student-assessment-player', params: { assessmentId: String(assessmentId) } }
    };
  }

  if (reportId) {
    if (isTeacherAudience) {
      return {
        kind: 'route',
        location: { name: 'teacher-reports-history', query: { reportId: String(reportId) } }
      };
    }
    return {
      kind: 'route',
      location: { name: 'student-reports', query: { reportId: String(reportId) } }
    };
  }

  if (courseId) {
    if (isTeacherAudience) {
      return {
        kind: 'route',
        location: { name: 'teacher-learning', query: { courseId: String(courseId) } }
      };
    }
    return {
      kind: 'route',
      location: { name: 'student-learning', query: { courseId: String(courseId) } }
    };
  }

  if (item.type === 'tutoring') {
    if (isTeacherAudience) {
      return { kind: 'route', location: { name: 'teacher-tutoring' } };
    }
    return { kind: 'route', location: { name: 'student-tutoring' } };
  }

  return { kind: 'none' };
};

export const isNotificationNavigable = (item: NotificationItem): boolean => {
  return resolveNotificationNavigation(item).kind !== 'none';
};
