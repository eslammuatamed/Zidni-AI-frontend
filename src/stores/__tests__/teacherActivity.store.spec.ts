import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useTeacherActivityStore, TEACHER_ACTIVITY_CACHE_TTL } from '@/stores/teacherActivity';
import { fetchTeacherLiveSessions } from '@/services/liveSessions';
import { fetchTeacherAssignments } from '@/services/learning';
import { useFeaturesStore } from '@/stores/features';
import { FEATURE } from '@/constants/featureCatalog';

vi.mock('@/services/liveSessions', () => ({
  fetchTeacherLiveSessions: vi.fn()
}));

vi.mock('@/services/learning', () => ({
  fetchTeacherAssignments: vi.fn()
}));

const mockedFetchTeacherLiveSessions = vi.mocked(fetchTeacherLiveSessions);
const mockedFetchTeacherAssignments = vi.mocked(fetchTeacherAssignments);

describe('teacher activity store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockedFetchTeacherLiveSessions.mockReset();
    mockedFetchTeacherAssignments.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));

    const featuresStore = useFeaturesStore();
    featuresStore.$patch({
      features: { [FEATURE.liveSessionsCore]: true },
      loaded: true,
      lastLoadedAt: Date.now()
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('loads sessions and assignments and filters upcoming items', async () => {
    mockedFetchTeacherLiveSessions.mockResolvedValue([
      {
        id: 1,
        courseId: 1,
        courseTitle: 'Math',
        title: 'Live 1',
        provider: 'zoom',
        status: 'scheduled',
        scheduledAt: '2024-01-01T02:00:00Z',
        durationMinutes: 60,
        registeredCount: 10,
        attendedCount: 0
      },
      {
        id: 2,
        courseId: 1,
        courseTitle: 'Math',
        title: 'Past',
        provider: 'zoom',
        status: 'cancelled',
        scheduledAt: '2023-12-30T02:00:00Z',
        durationMinutes: 60,
        registeredCount: 10,
        attendedCount: 0
      }
    ]);

    mockedFetchTeacherAssignments.mockResolvedValue([
      {
        id: 1,
        lessonId: 1,
        lessonTitle: 'Lesson',
        courseId: 1,
        courseTitle: 'Math',
        teacherId: 1,
        title: 'Essay',
        createdAt: '2023-12-31T00:00:00Z',
        dueAt: '2024-01-02T00:00:00Z'
      },
      {
        id: 2,
        lessonId: 1,
        lessonTitle: 'Lesson',
        courseId: 1,
        courseTitle: 'Math',
        teacherId: 1,
        title: 'Old',
        createdAt: '2023-12-01T00:00:00Z',
        dueAt: '2023-12-01T00:00:00Z'
      }
    ]);

    const store = useTeacherActivityStore();
    await store.load();

    expect(mockedFetchTeacherLiveSessions).toHaveBeenCalledTimes(1);
    expect(mockedFetchTeacherAssignments).toHaveBeenCalledTimes(1);
    expect(store.upcomingSessions).toHaveLength(1);
    expect(store.upcomingSessions[0].title).toBe('Live 1');
    expect(store.upcomingAssignments).toHaveLength(1);
    expect(store.upcomingAssignments[0].title).toBe('Essay');
  });

  it('sets error state on failure', async () => {
    mockedFetchTeacherLiveSessions.mockRejectedValue(new Error('offline'));
    mockedFetchTeacherAssignments.mockResolvedValue([]);

    const store = useTeacherActivityStore();
    await store.load();

    expect(store.error).toBe('LOAD_FAILED');
    expect(store.upcomingSessions).toHaveLength(0);
    expect(store.upcomingAssignments).toHaveLength(0);
  });

  it('keeps the last successful activity snapshot on failure', async () => {
    mockedFetchTeacherLiveSessions.mockResolvedValue([
      {
        id: 1,
        courseId: 1,
        courseTitle: 'Math',
        title: 'Live 1',
        provider: 'zoom',
        status: 'scheduled',
        scheduledAt: '2024-01-01T02:00:00Z',
        durationMinutes: 60,
        registeredCount: 10,
        attendedCount: 0
      }
    ]);

    mockedFetchTeacherAssignments.mockResolvedValue([
      {
        id: 1,
        lessonId: 1,
        lessonTitle: 'Lesson',
        courseId: 1,
        courseTitle: 'Math',
        teacherId: 1,
        title: 'Essay',
        createdAt: '2023-12-31T00:00:00Z',
        dueAt: '2024-01-02T00:00:00Z'
      }
    ]);

    const store = useTeacherActivityStore();
    await store.load();

    expect(store.upcomingSessions).toHaveLength(1);
    expect(store.upcomingAssignments).toHaveLength(1);

    mockedFetchTeacherLiveSessions.mockRejectedValueOnce(new Error('offline'));
    mockedFetchTeacherAssignments.mockRejectedValueOnce(new Error('offline'));

    await store.load(true);

    expect(store.error).toBe('LOAD_FAILED');
    expect(store.upcomingSessions).toHaveLength(1);
    expect(store.upcomingAssignments).toHaveLength(1);
  });

  it('skips live session fetch when feature is disabled', async () => {
    const featuresStore = useFeaturesStore();
    featuresStore.$patch({
      features: { [FEATURE.liveSessionsCore]: false },
      loaded: true,
      lastLoadedAt: Date.now()
    });

    mockedFetchTeacherLiveSessions.mockResolvedValue([]);
    mockedFetchTeacherAssignments.mockResolvedValue([]);

    const store = useTeacherActivityStore();
    await store.load();

    expect(mockedFetchTeacherLiveSessions).not.toHaveBeenCalled();
    expect(mockedFetchTeacherAssignments).toHaveBeenCalledTimes(1);
    expect(store.upcomingSessions).toHaveLength(0);
    expect(store.error).toBe('');
  });

  it('respects cache ttl', async () => {
    mockedFetchTeacherLiveSessions.mockResolvedValue([]);
    mockedFetchTeacherAssignments.mockResolvedValue([]);
    mockedFetchTeacherAssignments.mockResolvedValueOnce([
      {
        id: 1,
        lessonId: 1,
        lessonTitle: 'Lesson',
        courseId: 1,
        courseTitle: 'Math',
        teacherId: 1,
        title: 'Essay',
        createdAt: '2023-12-31T00:00:00Z',
        dueAt: '2024-01-02T00:00:00Z'
      }
    ]);
    mockedFetchTeacherAssignments.mockResolvedValueOnce([]);

    const store = useTeacherActivityStore();
    await store.load();
    await store.load();

    expect(mockedFetchTeacherLiveSessions).toHaveBeenCalledTimes(1);
    expect(mockedFetchTeacherAssignments).toHaveBeenCalledTimes(1);

    vi.setSystemTime(Date.now() + TEACHER_ACTIVITY_CACHE_TTL + 10);

    await store.load();
    expect(mockedFetchTeacherLiveSessions).toHaveBeenCalledTimes(2);
    expect(mockedFetchTeacherAssignments).toHaveBeenCalledTimes(2);
  });

  it('indicates when the cached activity is stale', async () => {
    mockedFetchTeacherLiveSessions.mockResolvedValue([]);
    mockedFetchTeacherAssignments.mockResolvedValue([]);

    const store = useTeacherActivityStore();
    await store.load();

    expect(store.isCacheStale()).toBe(false);

    vi.setSystemTime(Date.now() + TEACHER_ACTIVITY_CACHE_TTL - 1_000);
    expect(store.isCacheStale(5_000)).toBe(true);

    vi.setSystemTime(Date.now() + 10_000);
    expect(store.isCacheStale()).toBe(true);
  });
});
