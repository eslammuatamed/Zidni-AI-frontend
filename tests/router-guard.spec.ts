import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { createRouter, createMemoryHistory, type Router } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';
import { installGuards } from '@/router/guards';
import { useAuthStore, type AuthUser } from '@/stores/auth';

const hostState = {
  isApp: true,
  tenant: null as string | null
};

const locationReplaceMock = vi.fn();

vi.mock('@/lib/host', async () => {
  const actual = await vi.importActual<typeof import('@/lib/host')>('@/lib/host');
  return {
    ...actual,
    isAppHost: () => hostState.isApp,
    extractTenant: () => hostState.tenant,
    buildAppUrl: (path: string) => `https://app.test${path}`,
    buildTenantUrl: (tenant: string, path: string) => `https://${tenant}.tenant.test${path}`
  };
});

const stubComponent = {
  template: '<div />'
};

const createTestRouter = (): Router =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/teacher/home',
        name: 'teacher-dashboard',
        component: stubComponent,
        meta: { requiresAuth: true, roles: ['TEACHER'] }
      },
      {
        path: '/teacher/login',
        name: 'login-teacher',
        component: stubComponent
      },
      {
        path: '/student/home',
        name: 'student-dashboard',
        component: stubComponent,
        meta: { requiresAuth: true, roles: ['STUDENT'], tenantBound: true }
      },
      {
        path: '/student/login',
        name: 'login-student-fallback',
        component: stubComponent,
        meta: { tenantBound: true }
      },
      {
        path: '/login/admin',
        name: 'login-admin',
        component: stubComponent
      }
    ]
  });

const originalLocation = window.location;

beforeAll(() => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
      href: 'https://app.test/',
      host: 'app.test',
      protocol: 'https:',
      origin: 'https://app.test',
      assign: vi.fn(),
      reload: vi.fn(),
      replace: locationReplaceMock
    }
  });
});

afterAll(() => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: originalLocation
  });
});

describe('router guards', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    hostState.isApp = true;
    hostState.tenant = null;
    locationReplaceMock.mockClear();
  });

  it('redirects unauthenticated users to login with a single sanitized redirect', async () => {
    const router = createTestRouter();
    installGuards(router);

    await router.replace('/teacher/login');
    await router.isReady();

    const auth = useAuthStore();
    auth.$patch({ hydrated: true, user: null });
    auth.me = vi.fn().mockResolvedValue(null);

    await router.push('/teacher/home?redirect=%2Fteacher%2Flogin').catch(() => undefined);
    await nextTick();

    expect(router.currentRoute.value.name).toBe('login-teacher');
    expect(router.currentRoute.value.query.redirect).toBe('/teacher/home');
    expect(locationReplaceMock).not.toHaveBeenCalled();
  });

  it('redirects authenticated users away from login to their default area', async () => {
    const router = createTestRouter();
    installGuards(router);

    await router.replace('/teacher/login');
    await router.isReady();

    const auth = useAuthStore();
    const teacherUser: AuthUser = {
      id: 1,
      roles: ['TEACHER']
    };
    auth.$patch({ user: teacherUser, hydrated: true });
    auth.me = vi.fn().mockResolvedValue(teacherUser);

    await router.push('/teacher/login?redirect=%2Fstudent%2Fhome').catch(() => undefined);
    await nextTick();

    expect(router.currentRoute.value.fullPath).toBe('/teacher/home');
    expect(locationReplaceMock).not.toHaveBeenCalled();
  });

  it('hard redirects student routes from the app host to the tenant host', async () => {
    const router = createTestRouter();
    installGuards(router);

    await router.replace('/teacher/login');
    await router.isReady();
    locationReplaceMock.mockClear();

    const auth = useAuthStore();
    const studentUser: AuthUser = {
      id: 2,
      roles: ['STUDENT'],
      tenant: { id: 10, slug: 'academy' }
    };
    auth.$patch({ user: studentUser, hydrated: true });
    auth.me = vi.fn().mockResolvedValue(studentUser);

    hostState.isApp = true;
    hostState.tenant = null;

    await router.push('/student/home').catch(() => undefined);

    expect(locationReplaceMock).toHaveBeenCalledTimes(1);
    expect(locationReplaceMock).toHaveBeenCalledWith('https://academy.tenant.test/student/home');
    expect(router.currentRoute.value.fullPath).toBe('/teacher/login');
  });

  it('hard redirects teacher routes from tenant host back to the app host', async () => {
    const router = createTestRouter();
    installGuards(router);

    hostState.isApp = false;
    hostState.tenant = 'academy';

    await router.replace('/student/login');
    await router.isReady();
    locationReplaceMock.mockClear();

    const auth = useAuthStore();
    auth.$patch({ user: null, hydrated: true });
    auth.me = vi.fn().mockResolvedValue(null);

    await router.push('/teacher/home').catch(() => undefined);

    expect(locationReplaceMock).toHaveBeenCalledTimes(1);
    expect(locationReplaceMock).toHaveBeenCalledWith('https://app.test/teacher/home');
    expect(router.currentRoute.value.fullPath).toBe('/student/login');
  });
});
