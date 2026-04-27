import { defineStore } from 'pinia';
import { fetchTeacherSubscriptionSummary, type TeacherSubscriptionSummary } from '@/services/teacherSubscriptions';
import { isAuthorizationError } from '@/utils/httpError';

const DEFAULT_POLL_DURATION = 2 * 60 * 1000;
const DEFAULT_POLL_INTERVAL = 15 * 1000;

interface SubscriptionState {
  summary: TeacherSubscriptionSummary | null;
  loading: boolean;
  error: string;
  lastLoadedAt: number | null;
  pollingUntil: number;
  pollingHandle: number | null;
}

export const useSubscriptionStore = defineStore('subscription', {
  state: (): SubscriptionState => ({
    summary: null,
    loading: false,
    error: '',
    lastLoadedAt: null,
    pollingUntil: 0,
    pollingHandle: null
  }),
  getters: {
    currentSubscription(state) {
      return state.summary?.currentSubscription ?? null;
    },
    pendingRequests(state) {
      return state.summary?.pendingRequests ?? [];
    }
  },
  actions: {
    async loadSubscription(force = false): Promise<boolean> {
      if (this.loading) {
        return false;
      }
      if (!force && this.lastLoadedAt && Date.now() - this.lastLoadedAt < 3000) {
        return true;
      }
      this.loading = true;
      this.error = '';
      try {
        this.summary = await fetchTeacherSubscriptionSummary();
        this.lastLoadedAt = Date.now();
        if (this.summary?.currentSubscription) {
          this.stopPolling();
        }
        return true;
      } catch (error) {
        if (isAuthorizationError(error)) {
          this.error = 'UNAUTHORIZED';
        } else {
          this.error = 'LOAD_FAILED';
          console.warn('[subscription] failed to load subscription summary', error);
        }
        return false;
      } finally {
        this.loading = false;
      }
    },
    clear() {
      this.summary = null;
      this.error = '';
      this.lastLoadedAt = null;
    },
    startTemporaryPolling(duration = DEFAULT_POLL_DURATION, interval = DEFAULT_POLL_INTERVAL) {
      if (typeof window === 'undefined') {
        return;
      }
      const now = Date.now();
      const nextUntil = now + Math.max(duration, interval);
      if (this.pollingHandle && this.pollingUntil >= nextUntil) {
        return;
      }
      this.stopPolling();
      this.pollingUntil = nextUntil;
      this.pollingHandle = window.setInterval(() => {
        if (Date.now() > this.pollingUntil) {
          this.stopPolling();
          return;
        }
        void this.loadSubscription(true);
      }, Math.max(interval, 1000));
    },
    stopPolling() {
      if (this.pollingHandle && typeof window !== 'undefined') {
        window.clearInterval(this.pollingHandle);
      }
      this.pollingHandle = null;
      this.pollingUntil = 0;
    }
  }
});
