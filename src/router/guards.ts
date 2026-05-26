import type { RouteLocationNormalized, Router } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { isSessionRedirecting, triggerSessionRedirect } from '@/lib/sessionExpiry';
import { buildAppUrl, isAppHost } from '@/lib/host';

const TEACHER_ROLES = new Set(['TEACHER', 'TEACHER_ASSISTANT', 'PLATFORM_ADMIN']);

const resolveTeacherHome = (): string => '/teacher/home';
const resolveStudentHome = (): string => '/student/home';
// Teacher-assistants have their own /assistant/* section; live sessions is their landing page.
const ASSISTANT_HOME = '/assistant/live-sessions';

const resolveRouteRoleHint = (to: RouteLocationNormalized): string | null => {
  for (const record of to.matched) {
    if (typeof record.meta?.authRole === 'string') {
      return record.meta.authRole;
    }
    if (Array.isArray(record.meta?.roles) && record.meta.roles.length > 0) {
      const [first] = record.meta.roles;
      if (typeof first === 'string' && first.trim()) {
        return first;
      }
    }
  }
  return null;
};

export const installGuards = (router: Router) => {
  router.beforeEach(async (to, _from, next) => {
    const auth = useAuthStore();
    try {
      await auth.ensureSessionHydrated();
    } catch (error) {
      console.debug('[router] skipped session hydration', error);
    }

    const requiresAuth = to.matched.some((record) => record.meta?.requiresAuth);
    if (requiresAuth && !auth.isAuthenticated) {
      if (!isSessionRedirecting()) {
        const roleHint = resolveRouteRoleHint(to) ?? auth.role ?? null;
        const tenantHint = auth.tenantSlug;
        try {
          auth.clearAuthState();
        } catch (clearError) {
          console.debug('[router] unable to clear auth state after guard denial', clearError);
        }
        triggerSessionRedirect({ roleHint, tenantHint, currentUrl: to.fullPath, hadSession: auth.initialized });
      }
      return next(false);
    }

    const role = auth.role;
    const isTeacherRoute = to.path.startsWith('/teacher');
    const isStudentRoute = to.path.startsWith('/student');

    if (requiresAuth && role && TEACHER_ROLES.has(role) && !isAppHost()) {
      if (typeof window !== 'undefined') {
        const target = buildAppUrl(to.fullPath || to.path || '/');
        window.location.replace(target);
        return next(false);
      }
    }

    if (role === 'TEACHER_ASSISTANT' && isTeacherRoute) {
      // Authenticated assistants should never land on a teacher login page.
      if (to.path === '/teacher/login' || to.path === '/teacher/assistant/login') {
        return next({ path: ASSISTANT_HOME });
      }
      // Canonicalize teacher feature URLs to their /assistant/* mirror when one exists.
      // Shared components (CourseListView, assessments, the assignments dialog, etc.) push to
      // `teacher-*` route names; rewriting here keeps assistants inside their own section instead
      // of bouncing them home. Routes with no assistant equivalent fall back to live sessions.
      const mirrored = to.fullPath.replace(/^\/teacher\//, '/assistant/');
      const resolved = router.resolve(mirrored);
      if (resolved.name && resolved.name !== 'not-found' && resolved.fullPath !== to.fullPath) {
        return next(resolved.fullPath);
      }
      return next({ path: ASSISTANT_HOME });
    }

    if (role === 'STUDENT' && isTeacherRoute) {
      return next({ path: resolveStudentHome() });
    }

    if (role && TEACHER_ROLES.has(role) && isStudentRoute) {
      return next({ path: resolveTeacherHome() });
    }

    if (to.path === '/student/login' && role === 'STUDENT') {
      const queryNext = Array.isArray(to.query.next)
        ? to.query.next[0]
        : (to.query.next as string | undefined);
      const queryRedirect = Array.isArray(to.query.redirect)
        ? to.query.redirect[0]
        : (to.query.redirect as string | undefined);
      const redirect = queryNext || queryRedirect || resolveStudentHome();
      return next({ path: redirect });
    }

    if (to.path === '/teacher/login' && role && TEACHER_ROLES.has(role)) {
      const queryNext = Array.isArray(to.query.next)
        ? to.query.next[0]
        : (to.query.next as string | undefined);
      const queryRedirect = Array.isArray(to.query.redirect)
        ? to.query.redirect[0]
        : (to.query.redirect as string | undefined);
      const redirect = queryNext || queryRedirect || resolveTeacherHome();
      return next({ path: redirect });
    }

    next();
  });
};
