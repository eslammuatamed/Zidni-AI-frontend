import { defineStore } from 'pinia';
import { fetchTeacherLandingInquiryUnreadCount } from '@/services/landingInquiries';
import { useAuthStore } from './auth';

interface State {
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

export const useLandingInquiriesStore = defineStore('landingInquiries', {
  state: (): State => ({
    unreadCount: 0,
    loading: false,
    error: null
  }),
  actions: {
    async refreshUnreadCount() {
      const auth = useAuthStore();
      if (!auth.isAuthenticated || !auth.isTeacher) {
        this.unreadCount = 0;
        this.error = null;
        return;
      }
      this.loading = true;
      this.error = null;
      try {
        const response = await fetchTeacherLandingInquiryUnreadCount();
        this.unreadCount = response.unreadCount ?? 0;
      } catch (error) {
        this.error = 'load_failed';
      } finally {
        this.loading = false;
      }
    }
  }
});
