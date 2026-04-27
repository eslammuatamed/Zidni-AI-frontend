import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import {
  useTeacherDashboardStore,
  TEACHER_DASHBOARD_CACHE_TTL
} from '@/stores/teacherDashboard';
import { getOverview } from '@/api/reportsTeacher';
import { useFeaturesStore } from '@/stores/features';
import { FEATURE } from '@/constants/featureCatalog';

vi.mock('@/api/reportsTeacher', () => ({
  getOverview: vi.fn()
}));

const mockedGetOverview = vi.mocked(getOverview);

describe('Instructor dashboard store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockedGetOverview.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));

    const featuresStore = useFeaturesStore();
    featuresStore.$patch({
      features: { [FEATURE.reportsTeacher]: true },
      loaded: true,
      lastLoadedAt: Date.now()
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('loads dashboard overview metrics', async () => {
    mockedGetOverview.mockResolvedValue({
      totalEnrollments: 24,
      activeStudents: 12,
      revenueManual: 1500,
      revenueTutoring: 320,
      avgCourseRating: 4.8,
      completionRate: 86,
      paymentMethodCount: 2
    });

    const store = useTeacherDashboardStore();
    await store.loadOverview();

    expect(mockedGetOverview).toHaveBeenCalledTimes(1);
    expect(store.overview?.activeStudents).toBe(12);
    expect(store.error).toBe('');
  });

  it('marks an error when overview fails to load', async () => {
    mockedGetOverview.mockRejectedValue(new Error('offline'));

    const store = useTeacherDashboardStore();
    await store.loadOverview();

    expect(store.error).toBe('LOAD_FAILED');
    expect(store.overview).toBeNull();
  });

  it('keeps existing overview data when refresh fails', async () => {
    mockedGetOverview.mockResolvedValue({
      totalEnrollments: 24,
      activeStudents: 12,
      revenueManual: 1500,
      revenueTutoring: 320,
      avgCourseRating: 4.8,
      completionRate: 86,
      paymentMethodCount: 2
    });

    const store = useTeacherDashboardStore();
    await store.loadOverview();

    expect(store.overview?.activeStudents).toBe(12);

    mockedGetOverview.mockRejectedValueOnce(new Error('offline'));

    await store.loadOverview(true);

    expect(store.error).toBe('LOAD_FAILED');
    expect(store.overview?.activeStudents).toBe(12);
  });

  it('skips loading metrics when reports feature is disabled', async () => {
    const featuresStore = useFeaturesStore();
    featuresStore.$patch({
      features: { [FEATURE.reportsTeacher]: false },
      loaded: true,
      lastLoadedAt: Date.now()
    });

    const store = useTeacherDashboardStore();
    await store.loadOverview();

    expect(mockedGetOverview).not.toHaveBeenCalled();
    expect(store.overview).toBeNull();
    expect(store.error).toBe('');
  });

  it('uses cached overview when still fresh', async () => {
    mockedGetOverview.mockResolvedValue({
      totalEnrollments: 10,
      activeStudents: 5,
      revenueManual: 0,
      revenueTutoring: 0,
      avgCourseRating: 0,
      completionRate: 50,
      paymentMethodCount: 1
    });

    const store = useTeacherDashboardStore();
    await store.loadOverview();

    await store.loadOverview();
    expect(mockedGetOverview).toHaveBeenCalledTimes(1);

    vi.setSystemTime(Date.now() + TEACHER_DASHBOARD_CACHE_TTL + 1);
    mockedGetOverview.mockResolvedValueOnce({
      totalEnrollments: 11,
      activeStudents: 7,
      revenueManual: 0,
      revenueTutoring: 0,
      avgCourseRating: 0,
      completionRate: 52,
      paymentMethodCount: 1
    });

    await store.loadOverview();
    expect(mockedGetOverview).toHaveBeenCalledTimes(2);
  });

  it('identifies when the cached overview becomes stale', async () => {
    mockedGetOverview.mockResolvedValue({
      totalEnrollments: 10,
      activeStudents: 5,
      revenueManual: 0,
      revenueTutoring: 0,
      avgCourseRating: 0,
      completionRate: 50,
      paymentMethodCount: 1
    });

    const store = useTeacherDashboardStore();
    await store.loadOverview();

    expect(store.isCacheStale()).toBe(false);

    vi.setSystemTime(Date.now() + TEACHER_DASHBOARD_CACHE_TTL - 2_000);
    expect(store.isCacheStale(5_000)).toBe(true);

    vi.setSystemTime(Date.now() + 10_000);
    expect(store.isCacheStale()).toBe(true);
  });
});
