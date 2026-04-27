import { vi, describe, beforeEach, expect, it } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import type { IMessage } from '@stomp/stompjs';

vi.mock('@/router', () => {
  const currentRoute = { value: { meta: {} } };
  const replace = vi.fn().mockResolvedValue(undefined);
  return { default: { currentRoute, replace } };
});

vi.mock('@/services/api', () => ({
  default: { defaults: { baseURL: '/api' } }
}));

import { useFeatureSyncStore } from '@/stores/featureSync';
import { useFeaturesStore } from '@/stores/features';
import { useTenantStore } from '@/stores/tenant';
import { useAuthStore, type AuthUser } from '@/stores/auth';
import router from '@/router';

describe('featureSync store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('refreshes features when payload matches current tenant', async () => {
    const tenant = useTenantStore();
    tenant.slug = 'alpha';
    const auth = useAuthStore();
    const teacherUser: AuthUser = {
      id: 1,
      roles: ['TEACHER']
    };
    auth.$patch({ user: teacherUser, initialized: true });

    const features = useFeaturesStore();
    const refreshSpy = vi.spyOn(features, 'refresh').mockResolvedValue();

    const store = useFeatureSyncStore();
    store.connected = true;
    store.subscriptionTenant = 'alpha';
    store.targetTenant = 'alpha';

    const message: Partial<IMessage> = {
      body: JSON.stringify({ event: 'featuresInvalidated', tenant: 'alpha' }),
      headers: {},
      command: 'MESSAGE',
      ack: vi.fn(),
      nack: vi.fn()
    };

    await store.handleMessage(message as IMessage);

    expect(refreshSpy).toHaveBeenCalledTimes(1);
    expect(refreshSpy).toHaveBeenCalledWith({ tenant: 'alpha', role: 'TEACHER', audience: 'secure' });
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('ignores payloads for other tenants', async () => {
    const tenant = useTenantStore();
    tenant.slug = 'alpha';
    const auth = useAuthStore();
    const teacherUser: AuthUser = {
      id: 1,
      roles: ['TEACHER']
    };
    auth.$patch({ user: teacherUser, initialized: true });

    const features = useFeaturesStore();
    const refreshSpy = vi.spyOn(features, 'refresh').mockResolvedValue();

    const store = useFeatureSyncStore();
    store.connected = true;
    store.subscriptionTenant = 'alpha';
    store.targetTenant = 'alpha';

    const message: Partial<IMessage> = {
      body: JSON.stringify({ event: 'featuresInvalidated', tenant: 'beta' }),
      headers: {},
      command: 'MESSAGE',
      ack: vi.fn(),
      nack: vi.fn()
    };

    await store.handleMessage(message as IMessage);

    expect(refreshSpy).not.toHaveBeenCalled();
  });
});
