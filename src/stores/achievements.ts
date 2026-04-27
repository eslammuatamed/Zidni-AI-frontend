import { defineStore } from 'pinia';
import {
  fetchStudentAchievements,
  type LeaderboardPeriod,
  type StudentAchievementsPayload
} from '@/services/achievements';

export const useAchievementsStore = defineStore('achievements', {
  state: () => ({
    period: 'alltime' as LeaderboardPeriod,
    loading: false,
    error: '',
    data: null as StudentAchievementsPayload | null
  }),
  actions: {
    async load(period: LeaderboardPeriod = 'alltime', limit = 10) {
      this.loading = true;
      this.error = '';
      try {
        this.period = period;
        this.data = await fetchStudentAchievements(period, limit);
      } catch (error) {
        console.error('[achievements] failed to load', error);
        this.error = 'failed';
      } finally {
        this.loading = false;
      }
    },
    clear() {
      this.data = null;
      this.error = '';
      this.loading = false;
      this.period = 'alltime';
    }
  }
});
