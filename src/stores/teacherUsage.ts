import { defineStore } from 'pinia';
import {
  fetchTeacherVideoUsageSummary,
  fetchTeacherUsageTrends,
  type TeacherUsageTrendPoint,
  type TeacherVideoUsageSummary
} from '@/services/teacherUsage';
import { isAuthorizationError } from '@/utils/httpError';

interface TeacherUsageState {
  summary: TeacherVideoUsageSummary | null;
  loading: boolean;
  error: string;
  loadedAt: number | null;
  trends: TeacherUsageTrendPoint[];
  trendsLoading: boolean;
  trendsError: string;
  trendsLoadedAt: number | null;
}

const CACHE_TTL_MS = 60 * 1000;

export const useTeacherUsageStore = defineStore('teacher-usage', {
  state: (): TeacherUsageState => ({
    summary: null,
    loading: false,
    error: '',
    loadedAt: null,
    trends: [],
    trendsLoading: false,
    trendsError: '',
    trendsLoadedAt: null
  }),
  actions: {
    async loadSummary(force = false) {
      if (this.loading) return;
      if (!force && this.loadedAt && Date.now() - this.loadedAt < CACHE_TTL_MS) {
        return;
      }
      this.loading = true;
      this.error = '';
      try {
        this.summary = await fetchTeacherVideoUsageSummary();
        this.loadedAt = Date.now();
      } catch (error) {
        if (isAuthorizationError(error)) {
          this.error = 'UNAUTHORIZED';
        } else {
          this.error = 'LOAD_FAILED';
          console.error('[teacher-usage] failed to load usage summary', error);
        }
      } finally {
        this.loading = false;
      }
    },
    async loadTrends(force = false, months = 6) {
      if (this.trendsLoading) return;
      if (!force && this.trendsLoadedAt && Date.now() - this.trendsLoadedAt < CACHE_TTL_MS) {
        return;
      }
      this.trendsLoading = true;
      this.trendsError = '';
      try {
        const response = await fetchTeacherUsageTrends(months);
        this.trends = response.points ?? [];
        this.trendsLoadedAt = Date.now();
      } catch (error) {
        if (isAuthorizationError(error)) {
          this.trendsError = 'UNAUTHORIZED';
        } else {
          this.trendsError = 'LOAD_FAILED';
          console.error('[teacher-usage] failed to load usage trends', error);
        }
      } finally {
        this.trendsLoading = false;
      }
    },
    clear() {
      this.summary = null;
      this.error = '';
      this.loadedAt = null;
      this.trends = [];
      this.trendsError = '';
      this.trendsLoadedAt = null;
      this.trendsLoading = false;
    }
  }
});
