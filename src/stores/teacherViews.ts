import { defineStore } from 'pinia';
import { type Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import { createWsClient } from '@/composables/useWsClient';
import { getTeacherViewSummary, type TeacherViewSummaryResponse } from '@/api/teacherViews';
import { useAuthStore } from '@/stores/auth';
import { isAuthorizationError } from '@/utils/httpError';

interface TeacherViewSocketMessage {
  event?: string | null;
  summary?: TeacherViewSummaryResponse | null;
}

export const useTeacherViewsStore = defineStore('teacher-views', {
  state: () => ({
    summary: null as TeacherViewSummaryResponse | null,
    loading: false,
    error: '',
    client: null as Client | null,
    subscription: null as StompSubscription | null,
    connected: false,
    currentTeacherId: null as number | null
  }),
  actions: {
    async loadSummary() {
      if (this.loading) return;
      this.loading = true;
      this.error = '';
      try {
        this.summary = await getTeacherViewSummary();
      } catch (error) {
        if (isAuthorizationError(error)) {
          this.error = 'UNAUTHORIZED';
        } else {
          this.error = 'LOAD_FAILED';
        }
      } finally {
        this.loading = false;
      }
    },
    connect() {
      const auth = useAuthStore();
      if (!auth.isAuthenticated || !auth.isTeacher || !auth.teacherId) {
        this.disconnect();
        return;
      }
      const teacherId = auth.teacherId;
      if (this.connected && this.currentTeacherId === teacherId && this.client) {
        return;
      }
      if (!this.client) {
        this.client = createWsClient();
        this.client.onConnect = () => {
          this.connected = true;
          this.subscribe(teacherId);
        };
        this.client.onStompError = () => {
          this.connected = false;
        };
        this.client.onDisconnect = () => {
          this.connected = false;
        };
        this.client.onWebSocketClose = () => {
          this.connected = false;
        };
        this.client.activate();
      } else if (this.connected) {
        this.subscribe(teacherId);
      }
    },
    subscribe(teacherId: number) {
      if (!this.client) return;
      if (this.subscription) {
        try {
          this.subscription.unsubscribe();
        } catch (error) {
          console.warn('[teacher-views] failed to unsubscribe', error);
        }
      }
      const destination = `/topic/teacher-views/${teacherId}`;
      this.subscription = this.client.subscribe(destination, (message) => {
        void this.handleMessage(message);
      });
      this.currentTeacherId = teacherId;
    },
    async handleMessage(message: IMessage) {
      if (!message.body) return;
      try {
        const payload = JSON.parse(message.body) as TeacherViewSocketMessage;
        if (payload?.summary) {
          this.summary = payload.summary;
        } else if (payload?.event) {
          await this.loadSummary();
        }
      } catch (error) {
        console.warn('[teacher-views] failed to handle socket message', error);
      }
    },
    disconnect() {
      if (this.subscription) {
        try {
          this.subscription.unsubscribe();
        } catch (error) {
          console.warn('[teacher-views] failed to unsubscribe', error);
        }
        this.subscription = null;
      }
      if (this.client) {
        try {
          this.client.deactivate();
        } catch (error) {
          console.warn('[teacher-views] failed to deactivate client', error);
        }
        this.client = null;
      }
      this.connected = false;
      this.currentTeacherId = null;
    }
  }
});
