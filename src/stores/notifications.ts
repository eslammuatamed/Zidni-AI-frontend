import { defineStore } from 'pinia';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import api from '@/services/api';
import {
  listNotifications,
  markNotificationRead,
  type NotificationAudience,
  type NotificationFilters,
  type NotificationItem,
  type NotificationPageResponse,
  type NotificationStatus,
  type NotificationType
} from '@/api/notifications';
import { isAxiosError } from 'axios';
import { useAuthStore } from './auth';
import { useTenantStore } from './tenant';
import { useFeaturesStore, FEATURE } from './features';
import { parseNotificationContext } from '@/utils/notifications';

interface NotificationSocketMessage {
  event: 'created' | 'updated';
  notification: NotificationItem;
}

interface State {
  items: NotificationItem[];
  loading: boolean;
  connected: boolean;
  client: Client | null;
  connectionError: string;
  totalUnread: number;
  lastFilters: NotificationFilters | null;
  lastTotal: number;
  lastPageIndex: number;
  lastPageSize: number;
  activeAdminAlert: NotificationItem | null;
  dismissedAdminAlertIds: number[];
}

interface LegacyNotificationResponse {
  id: number;
  audience?: NotificationAudience;
  type?: NotificationType;
  status?: NotificationStatus;
  message: string;
  context?: string | null;
  createdAt: string;
  readAt?: string | null;
  studentId?: number | null;
  teacherId?: number | null;
}

const resolveBaseUrl = (): string => {
  const configured = api.defaults.baseURL as string | undefined;
  const base = configured && configured.startsWith('http') ? configured : window.location.origin;
  return base.replace(/\/$/, '');
};

const defaultWebSocketUrl = () => `${resolveBaseUrl()}/ws`;

const isLegacyFeatureError = (error: unknown) => {
  if (!isAxiosError(error)) {
    return false;
  }

  const status = error.response?.status ?? 0;
  if (status === 404) {
    return true;
  }

  if (status === 403) {
    const data = error.response?.data as Record<string, unknown> | undefined;
    const readData = (key: string) => (data && Object.prototype.hasOwnProperty.call(data, key) ? data[key] : undefined);
    const candidates = [
      readData('message'),
      readData('error'),
      readData('detail'),
      readData('reason'),
      error.response?.statusText
    ];
    const hasDisabledMessage = candidates.some((value) =>
      typeof value === 'string' && value.toLowerCase().includes('feature disabled')
    );
    if (hasDisabledMessage) {
      return true;
    }

    const codeCandidates = [readData('code'), readData('errorCode')];
    return codeCandidates.some((value) => typeof value === 'string' && value.toLowerCase().includes('feature_disabled'));
  }

  return false;
};

const mapLegacyNotification = (
  payload: LegacyNotificationResponse,
  fallbackAudience: NotificationAudience
): NotificationItem => ({
  id: payload.id,
  audience: payload.audience ?? fallbackAudience,
  type: payload.type ?? 'system',
  status: payload.status ?? 'unread',
  message: payload.message,
  context: payload.context ?? null,
  createdAt: payload.createdAt,
  readAt: payload.readAt ?? null,
  studentId: payload.studentId ?? null,
  teacherId: payload.teacherId ?? null
});

const buildLegacyPage = (
  items: LegacyNotificationResponse[],
  audience: NotificationAudience,
  filters: NotificationFilters
): NotificationPageResponse => {
  const normalizedItems = items.map((item) => mapLegacyNotification(item, audience));
  const unreadCount = normalizedItems.filter((item) => item.status === 'unread').length;
  const fallbackSize = normalizedItems.length > 0 ? normalizedItems.length : 20;
  return {
    items: normalizedItems,
    total: normalizedItems.length,
    page: 0,
    size: filters.size ?? fallbackSize,
    unreadCount
  };
};

const legacyListEndpoint = (audience: NotificationAudience) => {
  return audience === 'teacher' ? '/v1/teacher/notifications' : '/v1/students/notifications';
};

const legacyReadEndpoint = (audience: NotificationAudience, id: number) => {
  return audience === 'teacher'
    ? `/v1/teacher/notifications/${id}/read`
    : `/v1/students/notifications/${id}/read`;
};

const fetchLegacyNotifications = async (
  audience: NotificationAudience,
  filters: NotificationFilters
): Promise<NotificationPageResponse> => {
  const { data } = await api.get<LegacyNotificationResponse[]>(legacyListEndpoint(audience));
  return buildLegacyPage(data, audience, filters);
};

const toTimestamp = (value?: string): number | null => {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
};

const matchesFilters = (notification: NotificationItem, filters: NotificationFilters): boolean => {
  if (filters.audience !== notification.audience) {
    return false;
  }
  if (filters.type && filters.type !== 'all' && notification.type !== filters.type) {
    return false;
  }
  if (filters.status && filters.status !== 'all' && notification.status !== filters.status) {
    return false;
  }
  if (typeof filters.teacherId === 'number' && notification.teacherId !== filters.teacherId) {
    return false;
  }
  const createdAt = toTimestamp(notification.createdAt);
  const from = toTimestamp(filters.from);
  const to = toTimestamp(filters.to);
  if (from !== null && (createdAt === null || createdAt < from)) {
    return false;
  }
  if (to !== null && (createdAt === null || createdAt > to)) {
    return false;
  }
  return true;
};

const isAdminAlertNotification = (notification: NotificationItem): boolean => {
  if (notification.audience !== 'teacher' || notification.type !== 'system') {
    return false;
  }
  const context = parseNotificationContext(notification.context);
  if (!context) {
    return false;
  }
  const raw = (context as Record<string, unknown>).adminAlert;
  if (typeof raw === 'boolean') {
    return raw;
  }
  if (typeof raw === 'string') {
    return raw.toLowerCase() === 'true';
  }
  return false;
};

const resolveFeatureContextTenant = () => {
  const tenantStore = useTenantStore();
  return tenantStore.slug || tenantStore.branding?.slug || undefined;
};

const markLegacyNotificationRead = async (
  audience: NotificationAudience,
  id: number
): Promise<NotificationItem> => {
  const { data } = await api.patch<LegacyNotificationResponse>(legacyReadEndpoint(audience, id));
  return mapLegacyNotification(data, audience);
};

export const useNotificationStore = defineStore('notifications', {
  state: (): State => ({
    items: [],
    loading: false,
    connected: false,
    client: null,
    connectionError: '',
    totalUnread: 0,
    lastFilters: null,
    lastTotal: 0,
    lastPageIndex: 0,
    lastPageSize: 20,
    activeAdminAlert: null,
    dismissedAdminAlertIds: []
  }),
  getters: {
    unreadCount: (state) => state.totalUnread
  },
  actions: {
    async fetch(filters?: Partial<NotificationFilters>) {
      const auth = useAuthStore();
      if (!auth.isAuthenticated) {
        this.items = [];
        this.totalUnread = 0;
        this.lastFilters = null;
        this.activeAdminAlert = null;
        this.dismissedAdminAlertIds = [];
        return;
      }
      if (auth.isPlatformAdmin) {
        this.items = [];
        this.totalUnread = 0;
        this.lastFilters = null;
        this.activeAdminAlert = null;
        this.dismissedAdminAlertIds = [];
        return;
      }
      const audience: NotificationAudience = auth.isTeacherLike ? 'teacher' : 'student';
      const baseFilters: NotificationFilters = {
        audience,
        page: 0,
        size: 20,
        ...filters
      };
      this.loading = true;
      try {
        const page = await this.resolvePage(baseFilters);
        this.applyPage(page, baseFilters);
      } catch (error) {
        throw error;
      } finally {
        this.loading = false;
      }
    },
    async resolvePage(filters: NotificationFilters): Promise<NotificationPageResponse> {
      const auth = useAuthStore();
      const features = useFeaturesStore();
      const tenant = resolveFeatureContextTenant();
      if (!features.loaded || features.audience !== 'secure') {
        try {
          await features.ensureLoaded({ tenant, role: auth.role ?? undefined, audience: 'secure' });
        } catch (error) {
          console.warn('[notifications] failed to ensure secure feature catalog', error);
        }
      }
      const unifiedEnabled = features.hasFeature(FEATURE.notificationsUnified);
      if (!unifiedEnabled) {
        return fetchLegacyNotifications(filters.audience, filters);
      }
      try {
        return await listNotifications(filters);
      } catch (error) {
        if (isLegacyFeatureError(error)) {
          return fetchLegacyNotifications(filters.audience, filters);
        }
        throw error;
      }
    },
    async fetchForCurrentUser() {
      await this.fetch(this.lastFilters ?? {});
    },
    async markAsRead(notificationId: number) {
      const auth = useAuthStore();
      if (!auth.isAuthenticated) return;
      if (auth.isPlatformAdmin) return;
      const audience: NotificationAudience = auth.isTeacherLike ? 'teacher' : 'student';
      const previous = this.items.find((item: { id: number; status?: string }) => item.id === notificationId);
      try {
        const data = await markNotificationRead(notificationId, audience);
        this.upsert(data);
        if (previous?.status === 'unread' && data.status === 'read') {
          this.totalUnread = Math.max(0, this.totalUnread - 1);
        }
        this.updateAdminAlertFromItems();
      } catch (error) {
        if (!isLegacyFeatureError(error)) {
          throw error;
        }
        const data = await markLegacyNotificationRead(audience, notificationId);
        this.upsert(data);
        if (previous?.status === 'unread' && data.status === 'read') {
          this.totalUnread = Math.max(0, this.totalUnread - 1);
        }
        this.updateAdminAlertFromItems();
      }
    },
    connect() {
      const auth = useAuthStore();
      if (!auth.isAuthenticated) {
        return;
      }
      if (auth.isPlatformAdmin) {
        return;
      }
      if (this.client) {
        return;
      }
      const tenantStore = useTenantStore();
      const client = new Client({
        webSocketFactory: () => new SockJS(defaultWebSocketUrl()),
        connectHeaders: {},
        reconnectDelay: 5000
      });
      client.onConnect = () => {
        this.connected = true;
        this.connectionError = '';
        this.subscribeToTopics(client);
      };
      client.onStompError = (frame) => {
        this.connectionError = frame?.headers['message'] || 'stomp_error';
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
    disconnect() {
      if (this.client) {
        this.client.deactivate();
      }
      this.client = null;
      this.connected = false;
      this.connectionError = '';
    },
    subscribeToTopics(client: Client) {
      const auth = useAuthStore();
      if (auth.isStudent && auth.studentId) {
        client.subscribe(`/topic/notifications/students/${auth.studentId}`, (message) => this.handleSocket(message));
      }
      if (auth.isTeacher && auth.teacherId) {
        client.subscribe(`/topic/notifications/teachers/${auth.teacherId}`, (message) => this.handleSocket(message));
      }
    },
    async handleSocket(message: IMessage) {
      try {
        const payload = JSON.parse(message.body) as NotificationSocketMessage;
        const notification = payload.notification;
        if (!notification) {
          return;
        }
        const previousIndex = this.items.findIndex((item: { id: number }) => item.id === notification.id);
        const previous = previousIndex >= 0 ? this.items[previousIndex] : undefined;
        const previousStatus = previous?.status;
        const filters = this.lastFilters;
        const matches = filters ? matchesFilters(notification, filters) : true;

        if (matches) {
          this.upsert(notification);
        } else if (previousIndex >= 0) {
          this.items.splice(previousIndex, 1);
        }

        if (previousStatus !== 'unread' && notification.status === 'unread') {
          this.totalUnread += 1;
        } else if (previousStatus === 'unread' && notification.status === 'read') {
          this.totalUnread = Math.max(0, this.totalUnread - 1);
        }

        if (filters) {
          if (payload.event === 'created' && matches) {
            this.lastTotal += 1;
          } else if (previousIndex >= 0 && !matches) {
            this.lastTotal = Math.max(0, this.lastTotal - 1);
          } else if (
            previousIndex >= 0 &&
            filters.status === 'unread' &&
            previousStatus === 'unread' &&
            notification.status === 'read'
          ) {
            this.lastTotal = Math.max(0, this.lastTotal - 1);
          }
        }
      } catch (error) {
        console.warn('[notifications] failed to parse socket message', error);
      }
      this.updateAdminAlertFromItems();
    },
    upsert(notification: NotificationItem) {
      const index = this.items.findIndex((item) => item.id === notification.id);
      if (index >= 0) {
        this.items.splice(index, 1, notification);
      } else {
        this.items.unshift(notification);
      }
      this.items.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    updateAdminAlertFromItems(source?: NotificationItem[]) {
      const pool = (source ?? this.items).slice().sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      const next = pool.find((item) =>
        isAdminAlertNotification(item) && item.status === 'unread' && !this.dismissedAdminAlertIds.includes(item.id)
      );
      this.activeAdminAlert = next ?? null;
    },
    async acknowledgeAdminAlert() {
      const alert = this.activeAdminAlert;
      if (!alert) {
        return;
      }
      if (!this.dismissedAdminAlertIds.includes(alert.id)) {
        this.dismissedAdminAlertIds = [...this.dismissedAdminAlertIds, alert.id];
      }
      this.activeAdminAlert = null;
      if (alert.status !== 'read') {
        try {
          await this.markAsRead(alert.id);
        } catch (error) {
          console.warn('[notifications] failed to mark admin alert as read', error);
        }
      }
    },
    clear() {
      this.items = [];
      this.disconnect();
      this.totalUnread = 0;
      this.lastFilters = null;
      this.lastTotal = 0;
      this.lastPageIndex = 0;
      this.lastPageSize = 20;
      this.activeAdminAlert = null;
      this.dismissedAdminAlertIds = [];
    },
    applyPage(page: NotificationPageResponse, filters: NotificationFilters) {
  this.items = page.items.slice().sort((a: { createdAt: string }, b: { createdAt: string }) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      this.totalUnread = page.unreadCount;
      this.lastFilters = { ...filters };
      this.lastTotal = page.total;
      this.lastPageIndex = page.page;
      this.lastPageSize = page.size;
      this.updateAdminAlertFromItems(page.items);
    }
  }
});
