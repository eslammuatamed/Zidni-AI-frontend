import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import {
  useTeacherProfileStore,
  TEACHER_PROFILE_CACHE_TTL
} from '@/stores/teacherProfile';
import { getCurrentTeacherProfile } from '@/services/teacher';

vi.mock('@/services/teacher', () => ({
  getCurrentTeacherProfile: vi.fn()
}));

const mockedGetCurrentTeacherProfile = vi.mocked(getCurrentTeacherProfile);

describe('teacher profile store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockedGetCurrentTeacherProfile.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('loads the teacher profile and calculates completeness', async () => {
    mockedGetCurrentTeacherProfile.mockResolvedValue({
      id: 1,
      slug: 'academy',
      name: 'Academy',
      plan: 'pro',
      phoneCountryCode: '+1',
      phoneNumber: '00000000000',
      active: true,
      bio: 'Mentor',
      subject: 'Math',
      photoUrl: null
    });

    const store = useTeacherProfileStore();
    await store.load();

    expect(mockedGetCurrentTeacherProfile).toHaveBeenCalledTimes(1);
    expect(store.profile?.name).toBe('Academy');
    expect(store.profileCompleteness).toBe(67);
    expect(store.missingFields).toEqual(['photoUrl']);
  });

  it('handles load failures gracefully', async () => {
    mockedGetCurrentTeacherProfile.mockRejectedValue(new Error('boom'));

    const store = useTeacherProfileStore();
    await store.load();

    expect(store.error).toBe('LOAD_FAILED');
    expect(store.profile).toBeNull();
    expect(store.profileCompleteness).toBe(0);
    expect(store.missingFields).toEqual([]);
  });

  it('keeps the previous profile when a refresh fails', async () => {
    mockedGetCurrentTeacherProfile.mockResolvedValue({
      id: 1,
      slug: 'academy',
      name: 'Academy',
      plan: 'pro',
      phoneCountryCode: '+1',
      phoneNumber: '00000000000',
      active: true,
      bio: 'Mentor',
      subject: 'Math',
      photoUrl: 'https://cdn.example/avatar.png'
    });

    const store = useTeacherProfileStore();
    await store.load();

    expect(store.profile?.name).toBe('Academy');

    mockedGetCurrentTeacherProfile.mockRejectedValueOnce(new Error('offline'));

    await store.load(true);

    expect(store.error).toBe('LOAD_FAILED');
    expect(store.profile?.name).toBe('Academy');
  });

  it('avoids refetching within the cache window', async () => {
    mockedGetCurrentTeacherProfile.mockResolvedValue({
      id: 1,
      slug: 'academy',
      name: 'Academy',
      plan: 'pro',
      phoneCountryCode: '+1',
      phoneNumber: '00000000000',
      active: true,
      bio: 'Mentor',
      subject: 'Math',
      photoUrl: 'https://cdn.example/avatar.png'
    });

    const store = useTeacherProfileStore();
    await store.load();

    await store.load();
    expect(mockedGetCurrentTeacherProfile).toHaveBeenCalledTimes(1);

    vi.setSystemTime(Date.now() + TEACHER_PROFILE_CACHE_TTL + 1);
    mockedGetCurrentTeacherProfile.mockResolvedValueOnce({
      id: 1,
      slug: 'academy',
      name: 'Academy',
      plan: 'pro',
      phoneCountryCode: '+1',
      phoneNumber: '00000000000',
      active: true,
      bio: 'Mentor',
      subject: 'Math',
      photoUrl: 'https://cdn.example/avatar.png'
    });

    await store.load();
    expect(mockedGetCurrentTeacherProfile).toHaveBeenCalledTimes(2);
  });

  it('identifies stale cache boundaries', async () => {
    mockedGetCurrentTeacherProfile.mockResolvedValue({
      id: 1,
      slug: 'academy',
      name: 'Academy',
      plan: 'pro',
      phoneCountryCode: '+1',
      phoneNumber: '00000000000',
      active: true,
      bio: 'Mentor',
      subject: 'Math',
      photoUrl: 'https://cdn.example/avatar.png'
    });

    const store = useTeacherProfileStore();
    await store.load();

    expect(store.isCacheStale()).toBe(false);

    vi.setSystemTime(Date.now() + TEACHER_PROFILE_CACHE_TTL - 5_000);
    expect(store.isCacheStale(10_000)).toBe(false);

    vi.setSystemTime(Date.now() + 10_000);
    expect(store.isCacheStale()).toBe(true);
  });
});
