import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import api from '@/services/api';

const resolveBaseUrl = (): string => {
  const configured = api.defaults.baseURL as string | undefined;
  const windowOrigin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin.replace(/\/$/, '')
      : null;

  const tryNormalizeOrigin = (value?: string | null): string | null => {
    if (!value) return null;
    try {
      const url =
        typeof window !== 'undefined' && window.location?.origin
          ? new URL(value, window.location.origin)
          : new URL(value);
      const origin = url.origin.replace(/\/$/, '');
      const path = url.pathname.replace(/\/+$/, '');
      const suffix = path && path !== '/' ? path : '';
      return `${origin}${suffix}`;
    } catch {
      return null;
    }
  };

  return tryNormalizeOrigin(configured) ?? windowOrigin ?? '';
};

export interface WsClientOptions {
  headers?: Record<string, string>;
  reconnectDelay?: number;
}

type SockJsOptions = Parameters<typeof SockJS>[2];

const createSockJs = () => {
  const base = `${resolveBaseUrl().replace(/\/+$/, '')}/ws`;
  const transportOptions = {
    'xhr-streaming': { withCredentials: true },
    'xhr-polling': { withCredentials: true }
  };
  const options: SockJsOptions = {
    transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
    transportOptions,
    withCredentials: true
  };
  return new SockJS(base, undefined, options);
};

export const createWsClient = (options?: WsClientOptions): Client => {
  const headers: Record<string, string> = { ...(options?.headers ?? {}) };
  return new Client({
    webSocketFactory: () => createSockJs(),
    connectHeaders: headers,
    reconnectDelay: options?.reconnectDelay ?? 5000
  });
};
