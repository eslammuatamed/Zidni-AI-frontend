import { defineStore } from 'pinia';
import { fetchTeacherLiveSessions, type LiveSessionSummary } from '@/services/liveSessions';
import { fetchTeacherAssignments, type Assignment } from '@/services/learning';
import { isAuthorizationError } from '@/utils/httpError';
import { useFeaturesStore } from '@/stores/features';
import { FEATURE } from '@/constants/featureCatalog';

export interface TeacherActivityState {
  upcomingSessions: LiveSessionSummary[];
  upcomingAssignments: Assignment[];
  loading: boolean;
  error: string;
  loadedAt: number | null;
}

export const TEACHER_ACTIVITY_CACHE_TTL = 60 * 1000; // 1 minute

function sortByDate<T extends { scheduledAt?: string | null }>(items: T[]) {
  return [...items].sort((a, b) => {
    const aTime = a.scheduledAt ? new Date(a.scheduledAt).getTime() : Number.POSITIVE_INFINITY;
    const bTime = b.scheduledAt ? new Date(b.scheduledAt).getTime() : Number.POSITIVE_INFINITY;
    return aTime - bTime;
  });
}

function filterUpcomingSessions(sessions: LiveSessionSummary[]) {
  const now = Date.now();
  return sortByDate(
    sessions.filter((session) => {
      if (session.status === 'cancelled') {
        return false;
      }
      if (!session.scheduledAt) {
        return session.status === 'live';
      }
      const scheduledAt = new Date(session.scheduledAt).getTime();
      if (Number.isNaN(scheduledAt)) {
        return false;
      }
      return scheduledAt >= now - 30 * 60 * 1000; // keep sessions that started within last 30 minutes
    })
  ).slice(0, 5);
}

function filterUpcomingAssignments(assignments: Assignment[]) {
  const now = Date.now();
  return [...assignments]
    .filter((assignment) => {
      if (!assignment.dueAt) {
        return false;
      }
      const dueAt = new Date(assignment.dueAt).getTime();
      if (Number.isNaN(dueAt)) {
        return false;
      }
      return dueAt >= now - 24 * 60 * 60 * 1000; // include overdue within 24h to highlight urgency
    })
    .sort((a, b) => {
      const aDue = new Date(a.dueAt ?? 0).getTime();
      const bDue = new Date(b.dueAt ?? 0).getTime();
      return aDue - bDue;
    })
    .slice(0, 5);
}

export const useTeacherActivityStore = defineStore('teacher-activity', {
  state: (): TeacherActivityState => ({
    upcomingSessions: [],
    upcomingAssignments: [],
    loading: false,
    error: '',
    loadedAt: null
  }),
  actions: {
    isCacheStale(leeway = 0) {
      if (!this.loadedAt) {
        return true;
      }

      const effectiveTtl = Math.max(0, TEACHER_ACTIVITY_CACHE_TTL - leeway);
      return Date.now() - this.loadedAt >= effectiveTtl;
    },
    async load(force = false) {
      if (this.loading) {
        return;
      }

      const cacheValid =
        !force &&
        this.loadedAt !== null &&
        Date.now() - this.loadedAt < TEACHER_ACTIVITY_CACHE_TTL &&
        this.upcomingSessions.length + this.upcomingAssignments.length > 0;

      if (cacheValid) {
        return;
      }

      this.loading = true;
      this.error = '';

      const previousSessions = this.upcomingSessions;
      const previousAssignments = this.upcomingAssignments;
      const featuresStore = useFeaturesStore();
      const liveSessionsEnabled = featuresStore.hasFeature(FEATURE.liveSessionsCore);

      try {
        const sessionsPromise = liveSessionsEnabled
          ? fetchTeacherLiveSessions()
          : Promise.resolve<LiveSessionSummary[]>([]);
        const [sessions, assignments] = await Promise.all([
          sessionsPromise,
          fetchTeacherAssignments()
        ]);

        this.upcomingSessions = liveSessionsEnabled ? filterUpcomingSessions(sessions) : [];
        this.upcomingAssignments = filterUpcomingAssignments(assignments);
        this.loadedAt = Date.now();
      } catch (error) {
        if (isAuthorizationError(error)) {
          console.info('[teacherActivity] skipping load due to authorization error');
          this.error = 'UNAUTHORIZED';
          this.loadedAt = Date.now();
          if (!previousSessions.length) {
            this.upcomingSessions = [];
          }
          if (!previousAssignments.length) {
            this.upcomingAssignments = [];
          }
        } else {
          console.error('[teacherActivity] failed to load', error);
          this.error = 'LOAD_FAILED';
          if (!previousSessions.length) {
            this.upcomingSessions = [];
          }
          if (!previousAssignments.length) {
            this.upcomingAssignments = [];
          }
        }
      } finally {
        this.loading = false;
      }
    }
  }
});

export { filterUpcomingAssignments, filterUpcomingSessions };
