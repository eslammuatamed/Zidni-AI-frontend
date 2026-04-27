import type { RouteRecordRaw } from 'vue-router';

export const landingHomeRoute: RouteRecordRaw = {
  name: 'landing-home',
  path: '/',
  component: () => import('@/views/landing/LandingHome.vue'),
  meta: {
    layout: 'landing',
    disableShell: true
  }
};

export const loginTeacherRoute: RouteRecordRaw = {
  name: 'login-teacher',
  path: '/teacher/login',
  component: () => import('@/views/auth/TeacherLogin.vue'),
  meta: {
    disableShell: true,
    authRole: 'TEACHER',
    host: 'app'
  }
};

export const loginAdminRoute: RouteRecordRaw = {
  name: 'login-admin',
  path: '/login/admin',
  component: () => import('@/views/auth/AdminLogin.vue'),
  meta: {
    disableShell: true,
    host: 'app'
  }
};

export const appHostRoutes: RouteRecordRaw[] = [landingHomeRoute, loginTeacherRoute, loginAdminRoute];
