import { defineStore } from 'pinia';
import { getCurrentTeacherProfile, type TeacherProfileDetail } from '@/services/teacher';
import { isAuthorizationError } from '@/utils/httpError';

export type TeacherProfileMissingField = 'bio' | 'subject' | 'photoUrl';

export const TEACHER_PROFILE_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

const TEACHER_PROFILE_NAME_STORAGE_KEY = 'edtech_teacherName';

const getSafeLocalStorage = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch (error) {
    console.warn('[teacherProfile] localStorage is not available', error);
    return null;
  }
};

const safeLocalStorage = getSafeLocalStorage();

const readStoredTeacherName = () => {
  const cached = safeLocalStorage?.getItem(TEACHER_PROFILE_NAME_STORAGE_KEY);
  return cached ? cached.trim() : '';
};

interface TeacherProfileState {
  profile: TeacherProfileDetail | null;
  loading: boolean;
  error: string;
  loadedAt: number | null;
  cachedName: string;
}

export const useTeacherProfileStore = defineStore('teacher-profile', {
  state: (): TeacherProfileState => ({
    profile: null,
    loading: false,
    error: '',
    loadedAt: null,
    cachedName: readStoredTeacherName()
  }),
  getters: {
    profileCompleteness(state): number {
      if (!state.profile) {
        return 0;
      }

      const fields: TeacherProfileMissingField[] = ['bio', 'subject', 'photoUrl'];
      const filled = fields.reduce((count, field) => {
        const value = state.profile?.[field];
        return value ? count + 1 : count;
      }, 0);

      return Math.round((filled / fields.length) * 100);
    },
    missingFields(state): TeacherProfileMissingField[] {
      if (!state.profile) {
        return [];
      }

      const missing: TeacherProfileMissingField[] = [];

      if (!state.profile.bio) {
        missing.push('bio');
      }

      if (!state.profile.subject) {
        missing.push('subject');
      }

      if (!state.profile.photoUrl) {
        missing.push('photoUrl');
      }

      return missing;
    }
  },
  actions: {
    isCacheStale(leeway = 0) {
      if (!this.loadedAt) {
        return true;
      }

      const effectiveTtl = Math.max(0, TEACHER_PROFILE_CACHE_TTL - leeway);
      return Date.now() - this.loadedAt >= effectiveTtl;
    },
    async load(force = false) {
      if (this.loading) {
        return;
      }

      const cacheValid =
        !force &&
        this.profile &&
        this.loadedAt !== null &&
        Date.now() - this.loadedAt < TEACHER_PROFILE_CACHE_TTL;

      if (cacheValid) {
        return;
      }

      this.loading = true;
      this.error = '';

      const existingProfile = this.profile;

      try {
        this.profile = await getCurrentTeacherProfile();
        this.loadedAt = Date.now();

        const nextName = this.profile?.name?.trim();
        if (nextName) {
          this.cachedName = nextName;
          safeLocalStorage?.setItem(TEACHER_PROFILE_NAME_STORAGE_KEY, nextName);
        }
      } catch (error) {
        if (isAuthorizationError(error)) {
          console.info('[teacherProfile] skipping load due to authorization error');
          this.error = 'UNAUTHORIZED';
          this.loadedAt = Date.now();
          if (!existingProfile) {
            this.profile = null;
          }
        } else {
          console.error('[teacherProfile] failed to load profile', error);
          this.error = 'LOAD_FAILED';
          if (!existingProfile) {
            this.profile = null;
          }
        }
      } finally {
        this.loading = false;
      }
    },
    async fetchProfile(force = false) {
      await this.load(force);
      return this.profile;
    }
  }
});
