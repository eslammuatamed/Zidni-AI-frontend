import { defineStore } from 'pinia';
import { getOverview, type TeacherReportsOverviewResponse } from '@/api/reportsTeacher';
import { isAuthorizationError } from '@/utils/httpError';
import { useFeaturesStore } from '@/stores/features';
import { FEATURE } from '@/constants/featureCatalog';

export const TEACHER_DASHBOARD_CACHE_TTL = 60 * 1000; // 1 minute

interface TeacherDashboardState {
  overview: TeacherReportsOverviewResponse | null;
  loading: boolean;
  error: string;
  loadedAt: number | null;
}

export const useTeacherDashboardStore = defineStore('teacher-dashboard', {
  state: (): TeacherDashboardState => ({
    overview: null,
    loading: false,
    error: '',
    loadedAt: null
  }),
  actions: {
    isCacheStale(leeway = 0) {
      if (!this.loadedAt) {
        return true;
      }

      const effectiveTtl = Math.max(0, TEACHER_DASHBOARD_CACHE_TTL - leeway);
      return Date.now() - this.loadedAt >= effectiveTtl;
    },
    async loadOverview(force = false) {
      const featuresStore = useFeaturesStore();
      const reportsEnabled = featuresStore.hasFeature(FEATURE.reportsTeacher);

      if (!reportsEnabled) {
        this.loading = false;
        this.error = '';
        if (this.overview !== null) {
          this.overview = null;
        }
        this.loadedAt = Date.now();
        return;
      }

      if (this.loading) {
        return;
      }

      const cacheValid =
        !force &&
        this.overview &&
        this.loadedAt !== null &&
        Date.now() - this.loadedAt < TEACHER_DASHBOARD_CACHE_TTL;

      if (cacheValid) {
        return;
      }

      this.loading = true;
      this.error = '';

      const previousOverview = this.overview;

      try {
        this.overview = await getOverview();
        this.loadedAt = Date.now();
      } catch (error) {
        if (isAuthorizationError(error)) {
          console.info('[teacherDashboard] skipping overview load due to authorization error');
          this.error = 'UNAUTHORIZED';
          this.loadedAt = Date.now();
          if (!previousOverview) {
            this.overview = null;
          }
        } else {
          console.error('[teacherDashboard] failed to load overview', error);
          this.error = 'LOAD_FAILED';
          if (!previousOverview) {
            this.overview = null;
          }
        }
      } finally {
        this.loading = false;
      }
    }
  }
});
