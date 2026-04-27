import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

vi.mock('@/services/features', () => ({
  fetchResolvedFeatures: vi.fn(() => Promise.reject({ status: 403 }))
}));

import router from '@/router';
import { useAuthStore } from '@/stores/auth';
import { useTenantStore } from '@/stores/tenant';
import { useFeaturesStore } from '@/stores/features';

const resolveNavigation = async (path: string) => {
  await router.push(path);
  await router.isReady();
};

describe('router guard - assistant unauthorized features', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    const auth = useAuthStore();
    const tenant = useTenantStore();
    const features = useFeaturesStore();

    auth.$patch({
      token: 'token',
      role: 'TEACHER_ASSISTANT',
      assistantPermissions: []
    });
    tenant.$patch({
      slug: 'demo',
      rawSlug: 'demo'
    });
    features.reset();
    await resolveNavigation('/');
  });

  it('keeps assistants on /assistant when features load returns 403', async () => {
    await resolveNavigation('/assistant');

    expect(router.currentRoute.value.name).toBe('assistant-dashboard');
    expect(router.currentRoute.value.fullPath).toBe('/assistant');
    const features = useFeaturesStore();
    expect(features.featureError).toBe('features.errors.unauthorized');
  });
});
