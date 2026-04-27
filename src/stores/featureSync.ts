import { defineStore } from 'pinia';
import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import api from '@/services/api';
import router from '@/router';
import { useAuthStore } from '@/stores/auth';
import { useTenantStore } from '@/stores/tenant';
import { useFeaturesStore } from '@/stores/features';
import type { FeatureCode } from '@/constants/featureCatalog';

interface FeatureSyncMessage {
  event?: string | null;
  tenant?: string | null;
  teacherId?: number | null;
  issuedAt?: string | null;
}

const resolveBaseUrl = (): string => {
  const configured = api.defaults.baseURL as string | undefined;
  const base = configured && configured.startsWith('http') ? configured : window.location.origin;
  return base.replace(/\/$/, '');
};

const normalizeSlug = (value?: string | null): string => (value ?? '').trim().toLowerCase();

export const useFeatureSyncStore = defineStore('featureSync', {
  state: () => ({
    client: null as Client | null,
    subscription: null as StompSubscription | null,
    subscriptionTenant: '' as string,
    targetTenant: '' as string,
    connected: false,
    connectionError: ''
  }),
  actions: {
    connect(slug?: string) {
      const auth = useAuthStore();
      const tenantStore = useTenantStore();
      const target = normalizeSlug(slug ?? tenantStore.slug);
      this.targetTenant = target;
      if (!auth.isAuthenticated || !target) {
        this.disconnect();
        return;
      }
      if (this.client) {
        if (this.connected && this.subscriptionTenant !== target) {
          this.subscribe(this.client);
        }
        return;
      }
      const client = new Client({
        webSocketFactory: () => new SockJS(`${resolveBaseUrl()}/ws`),
        connectHeaders: {},
        reconnectDelay: 5000
      });
      client.onConnect = () => {
        this.connected = true;
        this.connectionError = '';
        this.subscribe(client);
      };
      client.onStompError = (frame) => {
        this.connectionError = frame?.headers?.['message'] || 'stomp_error';
      };
      client.onDisconnect = () => {
        this.connected = false;
      };
      client.onWebSocketClose = () => {
        this.connected = false;
      };
      client.activate();
      this.client = client;
    },
    subscribe(client: Client) {
      if (!this.connected) {
        return;
      }
      const tenantStore = useTenantStore();
      const slug = this.targetTenant || normalizeSlug(tenantStore.slug);
      if (!slug) {
        return;
      }
      if (this.subscription) {
        this.subscription.unsubscribe();
        this.subscription = null;
      }
      this.subscription = client.subscribe(
        `/topic/features/tenants/${slug}`,
        (message) => this.handleMessage(message)
      );
      this.subscriptionTenant = slug;
    },
    async handleMessage(message: IMessage) {
      try {
        const payload = JSON.parse(message.body) as FeatureSyncMessage;
        const tenantStore = useTenantStore();
        const currentSlug = normalizeSlug(tenantStore.slug);
        const target = normalizeSlug(payload?.tenant ?? this.subscriptionTenant ?? this.targetTenant);
        if (!target || !currentSlug || target !== currentSlug) {
          return;
        }
        const auth = useAuthStore();
        const features = useFeaturesStore();
        const context = {
          tenant: currentSlug,
          role: auth.role,
          audience: 'secure' as const
        };
        await features.refresh(context);
        this.enforceRouteAccess();
      } catch (error) {
        console.warn('[feature-sync] failed to process sync payload', error);
      }
    },
    enforceRouteAccess() {
      const current = router.currentRoute.value;
      const rawRequirement = current.meta?.requiresFeature as FeatureCode | FeatureCode[] | undefined;
      if (!rawRequirement) {
        return;
      }
      const requirements = Array.isArray(rawRequirement) ? rawRequirement : [rawRequirement];
      const features = useFeaturesStore();
      const missing = requirements.find((code) => !features.hasFeature(code));
      if (!missing) {
        return;
      }
      const auth = useAuthStore();
      const fallback = auth.role === 'STUDENT'
        ? { name: 'student-dashboard' }
        : auth.role === 'PLATFORM_ADMIN'
          ? { name: 'admin-console' }
          : { name: 'teacher-dashboard' };
      router.replace(fallback).catch(() => {
        /* ignore navigation duplication */
      });
    },
    disconnect() {
      if (this.subscription) {
        try {
          this.subscription.unsubscribe();
        } catch (error) {
          console.warn('[feature-sync] failed to unsubscribe', error);
        }
        this.subscription = null;
      }
      if (this.client) {
        try {
          this.client.deactivate();
        } catch (error) {
          console.warn('[feature-sync] failed to deactivate client', error);
        }
      }
      this.client = null;
      this.connected = false;
      this.subscriptionTenant = '';
      this.targetTenant = '';
      this.connectionError = '';
    }
  }
});
