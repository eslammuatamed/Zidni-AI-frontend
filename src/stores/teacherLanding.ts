import { defineStore } from 'pinia';
import {
  fetchPublicTeacherLanding,
  type TeacherLandingPublicResponse
} from '@/services/teacherLanding.api';

interface TeacherLandingState {
  data: TeacherLandingPublicResponse | null;
  loading: boolean;
  error: string;
  cache: Map<string, TeacherLandingPublicResponse>;
}

export const useTeacherLandingStore = defineStore('teacherLanding', {
  state: (): TeacherLandingState => ({
    data: null,
    loading: false,
    error: '',
    cache: new Map<string, TeacherLandingPublicResponse>()
  }),
  actions: {
    async load(slug: string, options: { force?: boolean } = {}) {
      const normalized = (slug || '').trim().toLowerCase();
      if (!normalized) {
        this.data = null;
        this.error = '';
        return null;
      }

      if (!options.force && this.cache.has(normalized)) {
        this.data = this.cache.get(normalized) ?? null;
        this.error = '';
        return this.data;
      }

      this.loading = true;
      this.error = '';
      try {
        const response = await fetchPublicTeacherLanding(normalized);
        this.data = response;
        this.cache.set(normalized, response);
      } catch (error) {
        console.error('[teacherLanding] failed to fetch landing', error);
        this.error = 'LOAD_FAILED';
        this.data = null;
        throw error;
      } finally {
        this.loading = false;
      }
    },
    clear() {
      this.data = null;
      this.error = '';
    },
    invalidate(slug?: string) {
      if (!slug) {
        this.cache.clear();
        return;
      }
      const normalized = slug.trim().toLowerCase();
      if (normalized) {
        this.cache.delete(normalized);
      }
    }
  }
});
