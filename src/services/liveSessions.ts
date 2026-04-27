import {
  listTeacherSessions,
  type TeacherLiveSession,
  type LiveSessionRegistration,
  type LiveSessionRegistrationStatus,
  type LiveSessionStatus,
  type LiveSessionProvider
} from '@/api/live';

export type { LiveSessionRegistration, LiveSessionRegistrationStatus, LiveSessionStatus, LiveSessionProvider };

export type LiveSessionSummary = TeacherLiveSession;

export async function fetchTeacherLiveSessions(courseId?: number) {
  const { items } = await listTeacherSessions({ courseId, page: 0, size: 200 });
  return items;
}
