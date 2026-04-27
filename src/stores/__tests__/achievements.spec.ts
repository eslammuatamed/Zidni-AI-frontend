import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { useAchievementsStore } from '../achievements';
import {
  fetchStudentAchievements,
  type StudentAchievementsPayload
} from '@/services/achievements';

vi.mock('@/services/achievements', () => ({
  fetchStudentAchievements: vi.fn()
}));

const mockedFetch = fetchStudentAchievements as unknown as Mock;

describe('achievements store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockedFetch.mockReset();
  });

  it('loads achievements successfully', async () => {
    const payload: StudentAchievementsPayload = {
      certificates: [
        {
          id: 1,
          courseId: 2,
          courseTitle: 'Course',
          pdfUrl: '/static/cert.pdf',
          qrCode: 'qr',
          issuedAt: new Date().toISOString()
        }
      ],
      badges: [],
      leaderboard: {
        period: 'alltime',
        entries: [
          { studentId: 1, studentName: 'Achiever', rank: 1, points: 100 }
        ]
      }
    };
    mockedFetch.mockResolvedValue(payload);
    const store = useAchievementsStore();

    await store.load('alltime');

    expect(store.data).toEqual(payload);
    expect(store.loading).toBe(false);
    expect(store.error).toBe('');
  });

  it('handles load failures', async () => {
    mockedFetch.mockRejectedValue(new Error('boom'));
    const store = useAchievementsStore();

    await store.load('weekly');

    expect(store.error).toBe('failed');
    expect(store.loading).toBe(false);
  });
});
