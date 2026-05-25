import { defineStore } from 'pinia';
import { http } from '@/lib/http';
import { useFeaturesStore, type FeatureContext } from '@/stores/features';
import { useTenantStore } from '@/stores/tenant';
import { useStudentStore } from '@/stores/student';
import { useAchievementsStore } from '@/stores/achievements';
import { useNotificationStore } from '@/stores/notifications';
import { useFeatureSyncStore } from '@/stores/featureSync';
import { useSubscriptionUpdatesStore } from '@/stores/subscriptionUpdates';
import {
  clearStoredTenantSlug,
  setStoredTenantSlug,
  normalizeTenantSlug
} from '@/utils/tenantStorage';

export type Role =
  | 'STUDENT'
  | 'TEACHER'
  | 'TEACHER_ASSISTANT'
  | 'PLATFORM_ADMIN'
  | (string & Record<string, never>);

export interface AuthUser {
  id: string | number | null;
  email: string | null;
  roles: Role[];
  tenant?: {
    id: string | number | null;
    slug: string | null;
  } | null;
  teacherId?: number | null;
  studentId?: number | null;
  assistantId?: number | null;
  assistantRoleId?: number | null;
  assistantName?: string | null;
  assistantPermissions?: string[];
}

interface AuthResponsePayload {
  id?: string | number | null;
  sub?: string | number | null;
  email?: string | null;
  principal?: string | null;
  role?: string | null;
  roles?: (string | null | undefined)[] | null;
  tenant?: { id?: string | number | null; slug?: string | null } | null;
  tenantSlug?: string | null;
  tenant_id?: string | number | null;
  teacherId?: number | null;
  studentId?: number | null;
  assistantId?: number | null;
  assistantRoleId?: number | null;
  assistantName?: string | null;
  assistantPermissions?: unknown;
}

const normalizeRoles = (input?: AuthResponsePayload['roles'] | AuthResponsePayload['role']): Role[] => {
  const list: string[] = [];

  if (Array.isArray(input)) {
    for (const value of input) {
      if (typeof value === 'string' && value.trim()) {
        list.push(value.trim().toUpperCase());
      }
    }
  } else if (typeof input === 'string' && input.trim()) {
    list.push(input.trim().toUpperCase());
  }

  return Array.from(new Set(list)) as Role[];
};

const normalizeTenant = (payload: AuthResponsePayload): AuthUser['tenant'] => {
  const candidates: Array<string | null> = [
    typeof payload.tenantSlug === 'string' ? payload.tenantSlug : null,
    typeof payload.tenant?.slug === 'string' ? payload.tenant.slug : null,
    typeof payload.tenant_id === 'string' || typeof payload.tenant_id === 'number'
      ? String(payload.tenant_id)
      : null
  ];

  const slugCandidate = candidates.find((value) => value && value.trim().length);
  if (!slugCandidate && !payload.tenant?.id) {
    return null;
  }

  const slug = slugCandidate ? slugCandidate.trim().toLowerCase() : null;
  const id =
    typeof payload.tenant?.id === 'string' || typeof payload.tenant?.id === 'number'
      ? payload.tenant.id
      : null;

  return {
    id,
    slug
  };
};

const normalizeAssistantPermissions = (input: unknown): string[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map((value) => value.trim());
};

const normalizeAuthUser = (payload: AuthResponsePayload): AuthUser => {
  const roles = normalizeRoles(payload.roles ?? payload.role);

  const idCandidate =
    typeof payload.id === 'string' || typeof payload.id === 'number'
      ? payload.id
      : typeof payload.sub === 'string' || typeof payload.sub === 'number'
        ? payload.sub
        : null;

  return {
    id: idCandidate,
    email:
      typeof payload.email === 'string'
        ? payload.email
        : typeof payload.principal === 'string'
          ? payload.principal
          : null,
    roles,
    tenant: normalizeTenant(payload),
    teacherId: typeof payload.teacherId === 'number' ? payload.teacherId : null,
    studentId: typeof payload.studentId === 'number' ? payload.studentId : null,
    assistantId: typeof payload.assistantId === 'number' ? payload.assistantId : null,
    assistantRoleId: typeof payload.assistantRoleId === 'number' ? payload.assistantRoleId : null,
    assistantName:
      typeof payload.assistantName === 'string' && payload.assistantName.trim()
        ? payload.assistantName.trim()
        : null,
    assistantPermissions: normalizeAssistantPermissions(payload.assistantPermissions)
  };
};

let pendingMe: Promise<AuthUser | null> | null = null;

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as AuthUser | null,
    loading: false,
    hydrated: false
  }),
  getters: {
    isAuthenticated: (state): boolean => Boolean(state.user),
    hasRole: (state) => (role: string): boolean => {
      const target = role.trim().toUpperCase();
      return Boolean(state.user?.roles.includes(target as Role));
    },
    tenantSlug: (state): string | null => state.user?.tenant?.slug ?? null,
    initialized: (state): boolean => state.hydrated,
    roles: (state): Role[] => state.user?.roles ?? [],
    role(): Role | null {
      return this.roles[0] ?? null;
    },
    isStudent(): boolean {
      return this.hasRole('STUDENT');
    },
    isTeacher(): boolean {
      return this.hasRole('TEACHER');
    },
    isAssistant(): boolean {
      return this.hasRole('TEACHER_ASSISTANT');
    },
    isTeacherLike(): boolean {
      return this.isTeacher || this.isAssistant;
    },
    isPlatformAdmin(): boolean {
      return this.hasRole('PLATFORM_ADMIN');
    },
    teacherId: (state): number | null => state.user?.teacherId ?? null,
    studentId: (state): number | null => state.user?.studentId ?? null,
    assistantId: (state): number | null => state.user?.assistantId ?? null,
    assistantRoleId: (state): number | null => state.user?.assistantRoleId ?? null,
    assistantName: (state): string | null => state.user?.assistantName ?? null,
    assistantPermissions: (state): string[] => state.user?.assistantPermissions ?? []
  },
  actions: {
    async me(force = false): Promise<AuthUser | null> {
      if (this.loading && pendingMe) {
        return pendingMe;
      }
      if (!force && this.hydrated && !pendingMe) {
        return this.user;
      }
      if (!force && this.user && !pendingMe) {
        return this.user;
      }
      if (pendingMe) {
        return pendingMe;
      }

      this.loading = true;

      pendingMe = http
        .get<AuthResponsePayload>('/v1/auth/me')
        .then(async ({ data }) => {
          const normalized = normalizeAuthUser(data);
          await this.applyUser(normalized);
          this.hydrated = true;
          return normalized;
        })
        .catch((error) => {
          this.clearAuthState();
          this.hydrated = true;
          throw error;
        })
        .finally(() => {
          this.loading = false;
          pendingMe = null;
        });

      return pendingMe;
    },
    async ensureSessionHydrated(force = false): Promise<void> {
      await this.handleSwitchTenantParam();
      if (this.hydrated && !force) {
        return;
      }
      try {
        await http.get('/csrf/ready');
      } catch (error) {
        console.debug('[auth] csrf bootstrap skipped', error);
      }
      try {
        await this.me(force);
      } catch (error) {
        console.debug('[auth] session hydration failed', error);
      }
    },
    async logout(): Promise<void> {
      try {
        await http.post('/v1/auth/logout');
      } catch (error) {
        console.warn('[auth] logout notification failed', error);
      } finally {
        this.clearAuthState();
        this.hydrated = false;
      }
    },
    setUser(user: AuthUser | null) {
      void this.applyUser(user);
      this.hydrated = true;
    },
    async applyUser(user: AuthUser | null): Promise<void> {
      this.user = user;

      const tenantStore = useTenantStore();
      const features = useFeaturesStore();

      const slug = typeof user?.tenant?.slug === 'string' ? user.tenant.slug : '';

      if (slug) {
        setStoredTenantSlug(slug);
        tenantStore.setSlug(slug);
        try {
          await tenantStore.fetchBranding(slug);
        } catch (error) {
          console.warn('[auth] unable to fetch tenant branding after login', error);
        }
      } else {
        clearStoredTenantSlug();
        tenantStore.setSlug('');
      }

      const featureContext: FeatureContext = {
        tenant: slug || null,
        role: this.role,
        audience: this.isAuthenticated ? 'secure' : 'public'
      };

      try {
        await features.refresh(featureContext);
      } catch (error) {
        console.warn('[auth] unable to refresh feature catalog', error);
      }
    },
    clearAuthState(): void {
      this.user = null;
      // const tenantStore = useTenantStore();
      // tenantStore.setSlug('');
      // clearStoredTenantSlug();
      try {
        useStudentStore().clear();
      } catch (error) {
        // optional store may not be initialised
      }
      try {
        useFeaturesStore().reset();
      } catch (error) {
        // optional store may not be initialised
      }
      try {
        useAchievementsStore().clear();
      } catch (error) {
        // optional store may not be initialised
      }
      try {
        useNotificationStore().disconnect();
      } catch (error) {
        // optional store may not be initialised
      }
      try {
        useFeatureSyncStore().disconnect();
      } catch (error) {
        // optional store may not be initialised
      }
      try {
        useSubscriptionUpdatesStore().disconnect();
      } catch (error) {
        // optional store may not be initialised
      }
    },
    async setTenantContext(payload: { teacherSlug?: string | null; teacherId?: number | null }) {
      const slug = normalizeTenantSlug(payload.teacherSlug);
      const user = this.user
        ? {
            ...this.user,
            teacherId:
              typeof payload.teacherId === 'number'
                ? payload.teacherId
                : this.user.teacherId ?? null,
            tenant: {
              id: this.user.tenant?.id ?? null,
              slug: (slug || this.user.tenant?.slug) ?? null
            }
          }
        : null;

      await this.applyUser(user);
    },
    async refreshStudentContext() {
      const studentStore = useStudentStore();
      try {
        const profile = await studentStore.fetchProfile();
        studentStore.profile = profile;
        await Promise.all([
          studentStore.fetchEnrollments(),
          studentStore.fetchPayments(),
          studentStore.fetchNotifications()
        ]);
      } catch (error) {
        console.warn('[auth] failed to refresh student context', error);
        throw error;
      }
    },
    async handleSwitchTenantParam(): Promise<void> {
      if (typeof window === 'undefined') {
        return;
      }
      const params = new URLSearchParams(window.location.search);
      const switchTenant = params.get('switchTenant')?.trim().toLowerCase();
      if (!switchTenant) {
        return;
      }
      try {
        await http.post('/v1/auth/switch-tenant', { tenantId: switchTenant });
      } catch (error) {
        console.warn('[auth] switch-tenant param failed', error);
      } finally {
        params.delete('switchTenant');
        const query = params.toString();
        const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
        window.history.replaceState({}, '', nextUrl);
      }
    }
  }
});

export default useAuthStore;
