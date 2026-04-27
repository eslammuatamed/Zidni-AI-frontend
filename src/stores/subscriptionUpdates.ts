import { defineStore } from 'pinia';
import { type Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import { createWsClient } from '@/composables/useWsClient';
import { useAuthStore } from '@/stores/auth';
import { useSubscriptionStore } from '@/stores/subscription';
import { useFeaturesStore } from '@/stores/features';
import { useTeacherProfileStore } from '@/stores/teacherProfile';
import { useToast } from '@/composables/useToast';
import i18n from '@/plugins/i18n';

interface SubscriptionUpdateMessage {
  event?: string | null;
  data?: unknown;
  ts?: string | null;
}

export const useSubscriptionUpdatesStore = defineStore('subscription-updates', {
  state: () => ({
    client: null as Client | null,
    subscription: null as StompSubscription | null,
    connected: false,
    currentTeacherId: null as number | null,
    lastEventId: ''
  }),
  actions: {
    connect() {
      const auth = useAuthStore();
      if (!auth.isAuthenticated || (!auth.isTeacher && !auth.isAssistant) || !auth.teacherId) {
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
      if (!this.client) {
        return;
      }
      if (this.subscription) {
        try {
          this.subscription.unsubscribe();
        } catch (error) {
          console.warn('[subscription-updates] failed to unsubscribe from previous channel', error);
        }
      }
      const destination = `/topic/subscription-updates/${teacherId}`;
      this.subscription = this.client.subscribe(destination, (message) => {
        void this.handleMessage(message);
      });
      this.currentTeacherId = teacherId;
    },
    async handleMessage(message: IMessage) {
      if (!message.body) {
        return;
      }
      try {
        const payload = JSON.parse(message.body) as SubscriptionUpdateMessage;
        if (payload?.event !== 'subscription.updated') {
          return;
        }
        const eventId = typeof payload.ts === 'string' ? payload.ts : `${Date.now()}-${Math.random()}`;
        if (eventId === this.lastEventId) {
          return;
        }
        this.lastEventId = eventId;
        const subscriptionStore = useSubscriptionStore();
        const featuresStore = useFeaturesStore();
        const teacherProfileStore = useTeacherProfileStore();

        const loaded = await subscriptionStore.loadSubscription(true);
        if (!loaded) {
          return;
        }

        subscriptionStore.stopPolling();
        const refreshResults = await Promise.allSettled([
          featuresStore.refresh(),
          teacherProfileStore.load(true)
        ]);
        const [featuresResult, profileResult] = refreshResults;
        if (featuresResult?.status === 'rejected') {
          console.warn('[subscription-updates] failed to refresh features after subscription update', featuresResult.reason);
        }
        if (profileResult?.status === 'rejected') {
          console.warn('[subscription-updates] failed to refresh teacher profile after subscription update', profileResult.reason);
        }

        const toast = useToast();
        const messageText = i18n.global.t('teacher.subscriptionUpdatedToast');
        toast.success({ detail: typeof messageText === 'string' ? messageText : String(messageText) });
      } catch (error) {
        console.warn('[subscription-updates] failed to process subscription message', error);
      }
    },
    disconnect() {
      if (this.subscription) {
        try {
          this.subscription.unsubscribe();
        } catch (error) {
          console.warn('[subscription-updates] failed to unsubscribe', error);
        }
        this.subscription = null;
      }
      if (this.client) {
        try {
          this.client.deactivate();
        } catch (error) {
          console.warn('[subscription-updates] failed to deactivate client', error);
        }
        this.client = null;
      }
      this.connected = false;
      this.currentTeacherId = null;
      this.lastEventId = '';
    }
  }
});
