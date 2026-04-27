import { createRouter, createWebHistory, type RouteLocationNormalized, type RouteLocationRaw } from 'vue-router';
import { installGuards } from '@/router/guards';
const TeacherLoginView = () => import('@/views/auth/TeacherLoginView.vue');
const TeacherDashboardView = () => import('@/views/TeacherDashboardView.vue');
const TeacherEnrollmentsView = () => import('@/views/TeacherEnrollmentsView.vue');
const TeacherRegistrationsView = () => import('@/views/TeacherRegistrationsView.vue');
const TeacherPaymentsView = () => import('@/views/TeacherPaymentsView.vue');
const TeacherPaymentSettingsView = () => import('@/views/TeacherPaymentSettingsView.vue');
const TeacherPlanCheckoutView = () => import('@/views/TeacherPlanCheckoutView.vue');

const TeacherQuestionBanksView = () => import('@/views/TeacherQuestionBanksView.vue');
const CourseListView = () => import('@/views/CourseListView.vue');
const CourseEditorView = () => import('@/views/CourseEditorView.vue');
const LessonEditorView = () => import('@/views/LessonEditorView.vue');
const PublicLandingView = () => import('@/views/PublicLandingView.vue');
const PublicCourseDetailView = () => import('@/views/PublicCourseDetailView.vue');
const PublicCoursesView = () => import('@/views/PublicCoursesView.vue');
const TeacherLandingView = () => import('@/views/public/TeacherLandingView.vue');
const TeacherLandingModernView = () => import('@/views/public/TeacherLandingModernView.vue');
const TenantLandingEntryView = () => import('@/views/TenantLandingEntryView.vue');
const LandingHome = () => import('@/views/landing/LandingHome.vue');
const LandingPrivacyPolicyView = () => import('@/views/landing/PrivacyPolicyView.vue');
const LandingTermsOfServiceView = () => import('@/views/landing/TermsOfServiceView.vue');
const LandingSupportView = () => import('@/views/landing/SupportView.vue');
const UserFeedbackView = () => import('@/views/shared/UserFeedbackView.vue');
const NotFoundView = LandingHome;
const PlatformTeachersView = () => import('@/views/platform/PlatformTeachersView.vue');
const PlatformCoursesView = () => import('@/views/platform/PlatformCoursesView.vue');
const PlatformCourseDetailView = () => import('@/views/platform/PlatformCourseDetailView.vue');
const PlatformMessagesView = () => import('@/views/platform/PlatformMessagesView.vue');
const AdminFeedbackInboxView = () => import('@/views/PlatformAdmin/FeedbackInbox.vue');
const AdminLoginView = () => import('@/views/auth/AdminLoginView.vue');
const TeacherRegisterView = () => import('@/views/auth/TeacherRegisterView.vue');
const TeacherVerifyView = () => import('@/views/auth/TeacherVerifyView.vue');
const StudentRegisterView = () => import('@/views/StudentRegisterView.vue');
const StudentLoginView = () => import('@/views/auth/StudentLoginView.vue');
const StudentChooseTenantView = () => import('@/views/student/StudentChooseTenant.vue');
const PasswordResetRequestView = () => import('@/views/auth/PasswordResetRequestView.vue');
const PasswordResetView = () => import('@/views/auth/PasswordResetView.vue');
const StudentVerifyView = () => import('@/views/StudentVerifyView.vue');
const StudentDashboardView = () => import('@/views/StudentDashboardView.vue');
const TeacherAssessmentsView = () => import('@/views/TeacherAssessmentsView.vue');
const TeacherRosterView = () => import('@/views/TeacherRosterView.vue');
const AssessmentBuilderView = () => import('@/views/AssessmentBuilderView.vue');
const StudentAssessmentsView = () => import('@/views/StudentAssessmentsView.vue');
const AssessmentPlayerView = () => import('@/views/AssessmentPlayerView.vue');
const TeacherAssessmentAttemptsView = () => import('@/views/TeacherAssessmentAttemptsView.vue');
const TeacherLiveSessionsList = () => import('@/views/teacher/live/LiveSessionsList.vue');
const TeacherLiveModerationView = () => import('@/views/teacher/live/LiveModeration.vue');
const TeacherLivePollsView = () => import('@/views/teacher/live/LivePolls.vue');
const StudentLiveSessionsList = () => import('@/views/student/live/StudentLiveSessions.vue');
const StudentLiveChatView = () => import('@/views/student/live/LiveChat.vue');
const StudentLivePollsView = () => import('@/views/student/live/LivePolls.vue');
const StudentReportsView = () => import('@/views/student/reports/StudentReports.vue');
const EnglishLabHome = () => import('@/modules/english-lab/pages/EnglishLabHome.vue');
const EnglishLabCategory = () => import('@/modules/english-lab/pages/CategoryPage.vue');
const EnglishLabQuiz = () => import('@/modules/english-lab/pages/QuizPage.vue');
const EnglishLabManagement = () => import('@/modules/english-lab/pages/EnglishLabManagement.vue');

const StudentAchievementsView = () => import('@/views/StudentAchievementsView.vue');
const StudentTeacherCoursesView = () => import('@/views/StudentTeacherCoursesView.vue');
const TeacherReportsView = () => import('@/views/TeacherReportsView.vue');
const TeacherReportsOverviewView = () => import('@/views/teacher/reports/TeacherReportsOverview.vue');
const TeacherNotificationsCenter = () => import('@/views/teacher/notifications/NotificationsCenter.vue');
const TeacherAuditView = () => import('@/views/teacher/audit/TeacherAudit.vue');
const StudentNotificationsCenter = () => import('@/views/student/notifications/NotificationsCenter.vue');
const TeacherLandingContentView = () => import('@/views/TeacherLandingContentView.vue');
const TeacherLandingMessagesView = () => import('@/views/teacher/TeacherLandingMessagesView.vue');
const TeacherPlanUpgradeView = () => import('@/views/TeacherPlanUpgradeView.vue');
const TeacherOffersListView = () => import('@/views/teacher/offers/OffersList.vue');
const TeacherOfferEditorView = () => import('@/views/teacher/offers/OfferEditorView.vue');
const TeacherTutoringView = () => import('@/views/TeacherTutoringView.vue');
const StudentTutoringView = () => import('@/views/StudentTutoringView.vue');
const TeacherLearningView = () => import('@/views/TeacherLearningView.vue');
const StudentLearningView = () => import('@/views/StudentLearningView.vue');
const StudentAssistantView = () => import('@/views/student/assistant/StudentAssistantView.vue');
const TeacherAssistantsView = () => import('@/views/teacher/assistants/AssistantsManagementView.vue');
const AssistantDashboardView = () => import('@/views/assistant/AssistantDashboardView.vue');
const TeacherCertificatesView = () => import('@/views/TeacherCertificatesView.vue');
const PlatformAdminPublicationsView = () => import('@/views/PlatformAdmin/PublicationsModeration.vue');
const PlatformAdminConsoleView = () => import('@/views/PlatformAdminConsoleView.vue');
const AdminCoursesModeration = () => import('@/views/admin/moderation/AdminCoursesModeration.vue');
const AdminBackupsView = () => import('@/views/admin/ops/AdminBackups.vue');
const AdminAuditView = () => import('@/views/admin/ops/AdminAudit.vue');
const AdminAnalyticsView = () => import('@/views/admin/analytics/AdminAnalytics.vue');
const AdminAnalyticsExportView = () => import('@/views/admin/analytics/AdminAnalyticsExport.vue');
const AdminPaymentLogsView = () => import('@/views/admin/ops/AdminPaymentLogs.vue');
const AdminAlertsView = () => import('@/views/admin/ops/AdminAlerts.vue');
const AdminTeachersView = () => import('@/views/admin/AdminTeachersView.vue');
const AdminStudentsView = () => import('@/views/admin/AdminStudentsView.vue');
const AdminPlanBuilder = () => import('@/views/admin/AdminPlanBuilder.vue');
const SubscriptionPaypalSuccessView = () => import('@/views/subscription/PaypalSuccessView.vue');

const PlatformVideosList = () => import('@/views/platform/VideosList.vue');
const PlatformVideoDetail = () => import('@/views/platform/VideoDetail.vue');
const StudentCheckoutView = () => import('@/views/StudentCheckoutView.vue');
const TeacherBadgesList = () => import('@/views/teacher/badges/BadgesList.vue');
const StudentBadgesView = () => import('@/views/student/badges/StudentBadges.vue');
const StudentAcademiesView = () => import('@/views/student/MyAcademiesView.vue');
const CertificateVerificationView = () => import('@/views/CertificateVerificationView.vue');

import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';
import { useFeaturesStore, type FeatureContext } from '@/stores/features';
import { useTenantStore } from '@/stores/tenant';
import i18n from '@/plugins/i18n';
import { FEATURE, type FeatureCode } from '@/constants/featureCatalog';
import { buildAppUrl, buildTenantUrl, isAppHost } from '@/lib/host';

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    roles?: Array<'STUDENT' | 'TEACHER' | 'TEACHER_ASSISTANT' | 'PLATFORM_ADMIN'>;
    requiresFeature?: FeatureCode | FeatureCode[];
    requiresAssistantPermissions?: string[];
    authRole?: string;
    layout?: string;
    disableShell?: boolean;
  }
}

const cloneLocationQuery = (query: RouteLocationNormalized['query']) => {
  const entries = Object.entries(query);
  if (entries.length === 0) {
    return undefined;
  }
  const cloned: Record<string, unknown> = {};
  for (const [key, value] of entries) {
    cloned[key] = Array.isArray(value) ? [...value] : value;
  }
  return cloned;
};

const buildLegacyTenantRedirect =
  (canonical: RouteLocationRaw, canonicalPath: string) => (to: RouteLocationNormalized) => {
    const rawTenant = Array.isArray(to.params.tenant) ? to.params.tenant[0] : to.params.tenant;
    const normalizedTenant = typeof rawTenant === 'string' ? rawTenant.trim().toLowerCase() : '';
    if (normalizedTenant && typeof window !== 'undefined') {
      window.location.replace(buildTenantUrl(normalizedTenant, canonicalPath));
      return false;
    }
    const nextLocation: RouteLocationRaw = { ...canonical };
    const clonedQuery = cloneLocationQuery(to.query);
    if (clonedQuery) {
      nextLocation.query = clonedQuery;
    }
    return nextLocation;
  };

const ensureAppTenantHost = (to: RouteLocationNormalized) => {
  if (isAppHost()) {
    return true;
  }

  const targetPath = to.fullPath || to.path || '/';
  if (typeof window !== 'undefined') {
    window.location.replace(buildAppUrl(targetPath));
    return false;
  }

  return true;
};

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'tenant-public-landing',
      component: TenantLandingEntryView,
      meta: { layout: 'landing', disableShell: true, tenantBound: true },
      alias: ['/']
    },
    {
      path: '/landing',
      name: 'landing',
      component: LandingHome,
      meta: { layout: 'landing', disableShell: true, tenantBound: true }
    },
    {
      path: '/privacy',
      name: 'privacy-policy',
      component: LandingPrivacyPolicyView,
      meta: { layout: 'landing', disableShell: true, tenantBound: true }
    },
    {
      path: '/terms',
      name: 'terms-of-service',
      component: LandingTermsOfServiceView,
      meta: { layout: 'landing', disableShell: true, tenantBound: true }
    },
    {
      path: '/certificate/verify/:code',
      name: 'certificate-verify',
      component: CertificateVerificationView,
      meta: {},
      alias: '/certificate/:code'
    },
    {
      path: '/support',
      name: 'support',
      component: LandingSupportView,
      meta: { layout: 'landing', disableShell: true, tenantBound: true }
    },
    {
      path: '/password/reset/:token',
      name: 'password-reset',
      component: PasswordResetView,
      meta: { disableShell: true }
    },
    {
      path: '/platform/teachers',
      name: 'platform-teachers',
      component: PlatformTeachersView,
      meta: { requiresAuth: true, roles: ['PLATFORM_ADMIN'] }
    },
    {
      path: '/platform/courses',
      name: 'platform-courses',
      component: PlatformCoursesView,
      meta: { requiresAuth: true, roles: ['PLATFORM_ADMIN'] }
    },
    {
      path: '/platform/courses/:id',
      name: 'platform-course-detail',
      component: PlatformCourseDetailView,
      meta: { requiresAuth: true, roles: ['PLATFORM_ADMIN'] }
    },
    {
      path: '/platform/videos',
      name: 'platform-videos',
      component: PlatformVideosList,
      meta: { requiresAuth: true, roles: ['PLATFORM_ADMIN'] }
    },
    {
      path: '/platform/videos/:id',
      name: 'platform-video-detail',
      component: PlatformVideoDetail,
      meta: { requiresAuth: true, roles: ['PLATFORM_ADMIN'] }
    },
    {
      path: '/teacher/login',
      name: 'login-teacher',
      component: TeacherLoginView,
      beforeEnter: ensureAppTenantHost,
      meta: { disableShell: true, authRole: 'TEACHER' }
    },
    {
      path: '/teacher/feedback',
      name: 'teacher-feedback',
      component: UserFeedbackView,
      props: { audience: 'teacher' },
      meta: { requiresAuth: true, roles: ['TEACHER'] }
    },
    {
      path: '/teacher/:teacherSlug',
      name: 'public-teacher-landing',
      component: TeacherLandingView,
      meta: { disableShell: true }
    },
    {
      path: '/:slug/courses/:courseId',
      name: 'public-course-detail',
      component: PublicCourseDetailView,
      meta: { layout: 'teacherLanding', disableShell: true },
      alias: ['/teacher/:slug/courses/:courseId']
    },

    {
      path: '/teacher/:tenant/login',
      name: 'login-teacher-legacy',
      component: TeacherLoginView,
      meta: { disableShell: true, authRole: 'TEACHER', tenantBound: true },
      beforeEnter: buildLegacyTenantRedirect({ name: 'login-teacher' }, '/teacher/login')
    },
    {
      path: '/teacher/:tenant/forgot-password',
      name: 'teacher-forgot-password-legacy',
      component: PasswordResetRequestView,
      meta: { disableShell: true, authRole: 'TEACHER', tenantBound: true },
      beforeEnter: buildLegacyTenantRedirect({ name: 'teacher-forgot-password' }, '/teacher/forgot-password')
    },
    {
      path: '/teacher/forgot-password',
      name: 'teacher-forgot-password',
      component: PasswordResetRequestView,
      meta: { disableShell: true, authRole: 'TEACHER' }
    },
    {
      path: '/teacher/assistant/login',
      name: 'assistant-login',
      component: TeacherLoginView,
      meta: { disableShell: true, authRole: 'TEACHER_ASSISTANT' },
      beforeEnter: ensureAppTenantHost
    },
    {
      path: '/assistant/login',
      name: 'assistant-login-legacy',
      component: TeacherLoginView,
      meta: { disableShell: true, authRole: 'TEACHER_ASSISTANT' },
      beforeEnter: () => {
        if (typeof window !== 'undefined') {
          window.location.replace(buildAppUrl('/teacher/assistant/login'));
          return false;
        }
        return { path: '/teacher/assistant/login', replace: true };
      }
    },
    {
      path: '/assistant/:tenant/login',
      name: 'assistant-login-tenant-legacy',
      component: TeacherLoginView,
      meta: { disableShell: true, authRole: 'TEACHER_ASSISTANT', tenantBound: true },
      beforeEnter: buildLegacyTenantRedirect({ name: 'assistant-login' }, '/teacher/assistant/login')
    },
    {
      path: '/assistant/:tenant/forgot-password',
      name: 'assistant-forgot-password-legacy',
      component: PasswordResetRequestView,
      meta: { disableShell: true, authRole: 'TEACHER_ASSISTANT', tenantBound: true },
      beforeEnter: buildLegacyTenantRedirect(
        { name: 'assistant-forgot-password' },
        '/teacher/assistant/forgot-password'
      )
    },
    {
      path: '/teacher/assistant/forgot-password',
      name: 'assistant-forgot-password',
      component: PasswordResetRequestView,
      meta: { disableShell: true, authRole: 'TEACHER_ASSISTANT' },
      beforeEnter: ensureAppTenantHost
    },
    {
      path: '/assistant/forgot-password',
      name: 'assistant-forgot-password-legacy-redirect',
      component: PasswordResetRequestView,
      meta: { disableShell: true, authRole: 'TEACHER_ASSISTANT' },
      beforeEnter: () => {
        if (typeof window !== 'undefined') {
          window.location.replace(buildAppUrl('/teacher/assistant/forgot-password'));
          return false;
        }
        return { path: '/teacher/assistant/forgot-password', replace: true };
      }
    },
    {
      path: '/teacher/assistant/feedback',
      name: 'assistant-feedback',
      component: UserFeedbackView,
      props: { audience: 'assistant' },
      meta: { requiresAuth: true, roles: ['TEACHER_ASSISTANT'] },
      beforeEnter: ensureAppTenantHost
    },
    {
      path: '/assistant/feedback',
      name: 'assistant-feedback-legacy',
      component: UserFeedbackView,
      props: { audience: 'assistant' },
      meta: { requiresAuth: true, roles: ['TEACHER_ASSISTANT'] },
      beforeEnter: () => {
        if (typeof window !== 'undefined') {
          window.location.replace(buildAppUrl('/teacher/assistant/feedback'));
          return false;
        }
        return { path: '/teacher/assistant/feedback', replace: true };
      }
    },
    {
      path: '/ai',
      redirect: '/assistant'
    },
    {
      path: '/register/teacher',
      name: 'teacher-register',
      component: TeacherRegisterView,
      beforeEnter: ensureAppTenantHost,
      meta: { disableShell: true },
      alias: '/teacher/register'
    },
    {
      path: '/teacher/verify/:token?',
      name: 'teacher-verify',
      component: TeacherVerifyView,
      meta: { disableShell: true }
    },
    {
      path: '/login/admin',
      name: 'login-admin',
      component: AdminLoginView,
      meta: { disableShell: true }
    },
    {
      path: '/student/register',
      name: 'student-register',
      component: StudentRegisterView,
      meta: { disableShell: true, tenantBound: true }
    },
    {
      path: '/:tenant/login',
      name: 'login-student',
      component: StudentLoginView,
      meta: { disableShell: true, tenantBound: true }
    },
    {
      path: '/student/login',
      name: 'login-student-fallback',
      component: StudentLoginView,
      meta: { disableShell: true, tenantBound: true },
      alias: '/login/student'
    },
    {
      path: '/student/choose-tenant',
      name: 'student-choose-tenant',
      component: StudentChooseTenantView,
      meta: { disableShell: true, requiresAuth: true, roles: ['STUDENT'] }
    },
    {
      path: '/student/forgot-password',
      name: 'student-forgot-password',
      component: PasswordResetRequestView,
      meta: { disableShell: true, authRole: 'STUDENT', tenantBound: true }
    },
    {
      path: '/student/verify/:token?',
      name: 'student-verify',
      component: StudentVerifyView,
      meta: { tenantBound: true }
    },
    {
      path: '/student',
      redirect: '/student/home'
    },
    {
      path: '/student/home',
      name: 'student-dashboard',
      component: StudentDashboardView,
      meta: { requiresAuth: true, tenantBound: true, roles: ['STUDENT'] },
      alias: ['/student/dashboard']
    },
    {
      path: '/student/academies',
      name: 'student-academies',
      component: StudentAcademiesView,
      meta: { requiresAuth: true, tenantBound: true, roles: ['STUDENT'] }
    },
    {
      path: '/student/teacher-courses',
      name: 'student-teacher-courses',
      component: StudentTeacherCoursesView,
      meta: { requiresAuth: true, tenantBound: true, roles: ['STUDENT'] }
    },
    {
      path: '/student/feedback',
      name: 'student-feedback',
      component: UserFeedbackView,
      props: { audience: 'student' },
      meta: { requiresAuth: true, tenantBound: true, roles: ['STUDENT'] }
    },
    {
      path: '/student/assessments',
      name: 'student-assessments',
      component: StudentAssessmentsView,
      meta: { requiresAuth: true, tenantBound: true, roles: ['STUDENT'] }
    },
    {
      path: '/student/assessments/:assessmentId',
      name: 'student-assessment-player',
      component: AssessmentPlayerView,
      meta: { requiresAuth: true, tenantBound: true, roles: ['STUDENT'] }
    },
    {
      path: '/teacher',
      redirect: '/teacher/home'
    },
    {
      path: '/teacher/home',
      name: 'teacher-dashboard',
      component: TeacherDashboardView,
      meta: { requiresAuth: true, roles: ['TEACHER'] },
      alias: ['/teacher/dashboard']
    },
    {
      path: '/teacher/courses',
      name: 'teacher-courses',
      component: CourseListView,
      meta: {
        requiresAuth: true,
        roles: ['TEACHER', 'TEACHER_ASSISTANT'],
        requiresAssistantPermissions: ['courses.manage']
      }
    },
    {
      path: '/teacher/roster',
      name: 'teacher-roster',
      component: TeacherRosterView,
      meta: {
        requiresAuth: true,
        roles: ['TEACHER', 'TEACHER_ASSISTANT'],
        requiresFeature: FEATURE.teacherRosterGroups,
        requiresAssistantPermissions: ['students.view']
      }
    },
    {
      path: '/teacher/registrations',
      name: 'teacher-registrations',
      component: TeacherRegistrationsView,
      meta: {
        requiresAuth: true,
        roles: ['TEACHER', 'TEACHER_ASSISTANT'],
        requiresFeature: FEATURE.teacherRegsPayments,
        requiresAssistantPermissions: ['registrations.manage']
      }
    },
    {
      path: '/teacher/payments',
      name: 'teacher-payments',
      component: TeacherPaymentsView,
      meta: {
        requiresAuth: true,
        roles: ['TEACHER', 'TEACHER_ASSISTANT'],
        requiresFeature: FEATURE.teacherRegsPayments,
        requiresAssistantPermissions: ['registrations.manage']
      }
    },
    {
      path: '/teacher/payments/manual-settings',
      name: 'teacher-payment-settings',
      component: TeacherPaymentSettingsView,
      meta: {
        requiresAuth: true,
        roles: ['TEACHER']
      }
    },
    {
      path: '/teacher/courses/:courseId',
      name: 'teacher-course',
      component: CourseEditorView,
      meta: {
        requiresAuth: true,
        roles: ['TEACHER', 'TEACHER_ASSISTANT'],
        requiresAssistantPermissions: ['courses.manage']
      }
    },
    {
      path: '/teacher/courses/:courseId/modules/:moduleId/lessons/new',
      name: 'teacher-lesson-create',
      component: LessonEditorView,
      meta: {
        requiresAuth: true,
        roles: ['TEACHER', 'TEACHER_ASSISTANT'],
        requiresAssistantPermissions: ['courses.manage']
      }
    },
    {
      path: '/teacher/courses/:courseId/modules/:moduleId/lessons/:lessonId',
      name: 'teacher-lesson-edit',
      component: LessonEditorView,
      meta: {
        requiresAuth: true,
        roles: ['TEACHER', 'TEACHER_ASSISTANT'],
        requiresAssistantPermissions: ['courses.manage']
      }
    },
    {
      path: '/teacher/question-banks',
      name: 'teacher-question-banks',
      component: TeacherQuestionBanksView,
      meta: {
        requiresAuth: true,
        roles: ['TEACHER', 'TEACHER_ASSISTANT', 'PLATFORM_ADMIN'],
        requiresAssistantPermissions: ['assessments.manage']
      }
    },
    {
      path: '/teacher/assessments',
      name: 'teacher-assessments',
      component: TeacherAssessmentsView,
      meta: {
        requiresAuth: true,
        roles: ['TEACHER', 'TEACHER_ASSISTANT'],
        requiresAssistantPermissions: ['assessments.manage']
      }
    },
    {
      path: '/teacher/assessments/:assessmentId',
      name: 'teacher-assessment-builder',
      component: AssessmentBuilderView,
      meta: {
        requiresAuth: true,
        roles: ['TEACHER', 'TEACHER_ASSISTANT'],
        requiresAssistantPermissions: ['assessments.manage']
      }
    },
    {
      path: '/teacher/assessments/:assessmentId/attempts',
      name: 'teacher-assessment-attempts',
      component: TeacherAssessmentAttemptsView,
      meta: {
        requiresAuth: true,
        roles: ['TEACHER', 'TEACHER_ASSISTANT'],
        requiresAssistantPermissions: ['assessments.manage']
      }
    },
    {
      path: '/teacher/live-sessions',
      name: 'teacher-live-sessions',
      component: TeacherLiveSessionsList,
      meta: { requiresAuth: true, roles: ['TEACHER'], requiresFeature: FEATURE.liveSessionsCore }
    },
    {
      path: '/teacher/live-moderation',
      name: 'teacher-live-moderation',
      component: TeacherLiveModerationView,
      meta: { requiresAuth: true, roles: ['TEACHER'], requiresFeature: FEATURE.liveSessionsChat }
    },
    {
      path: '/teacher/live-polls',
      name: 'teacher-live-polls',
      component: TeacherLivePollsView,
      meta: { requiresAuth: true, roles: ['TEACHER'], requiresFeature: FEATURE.liveSessionsPolls }
    },
    {
      path: '/teacher/tutoring',
      name: 'teacher-tutoring',
      component: TeacherTutoringView,
      meta: {
        requiresAuth: true,
        roles: ['TEACHER', 'TEACHER_ASSISTANT'],
        requiresAssistantPermissions: ['tutoring.manage']
      }
    },
    {
      path: '/student/english-lab',
      name: 'student-english-lab-home',
      component: EnglishLabHome,
      meta: { requiresAuth: true, tenantBound: true, roles: ['STUDENT'] }
    },
    {
      path: '/student/english-lab/:category',
      name: 'student-english-lab-category',
      component: EnglishLabCategory,
      meta: { requiresAuth: true, tenantBound: true, roles: ['STUDENT'] }
    },
    {
      path: '/student/english-lab/:category/quiz',
      name: 'student-english-lab-quiz',
      component: EnglishLabQuiz,
      meta: { requiresAuth: true, tenantBound: true, roles: ['STUDENT'] }
    },
    {
      path: '/english-lab',
      name: 'english-lab-redirect',
      beforeEnter: () => {
        const auth = useAuthStore();
        if (auth.isTeacher) {
          return { name: 'teacher-english-lab-management' };
        }
        return { name: 'student-english-lab-home' };
      }
    }, {
      path: '/english-lab/:category',
      name: 'english-lab-category-redirect',
      beforeEnter: (to) => {
        const auth = useAuthStore();
        if (auth.isTeacher) {
          return { name: 'teacher-english-lab-management' };
        }
        return { name: 'student-english-lab-category', params: to.params };
      }
    },
    {
      path: '/english-lab/:category/quiz',
      name: 'english-lab-quiz-redirect',
      beforeEnter: (to) => {
        const auth = useAuthStore();
        if (auth.isTeacher) {
          return { name: 'teacher-english-lab-management' };
        }
        return { name: 'student-english-lab-quiz', params: to.params };
      }
    },
    {
      path: '/teacher/english-lab',
      name: 'teacher-english-lab-management',
      component: EnglishLabManagement,
      meta: { requiresAuth: true, roles: ['TEACHER'] }
    },
    {
      path: '/teacher/learning',
      name: 'teacher-learning',
      component: TeacherLearningView,
      meta: { requiresAuth: true, roles: ['TEACHER'] }
    },
    {
      path: '/teacher/reports',
      name: 'teacher-reports',
      component: TeacherReportsOverviewView,
      meta: {
        requiresAuth: true,
        roles: ['TEACHER', 'TEACHER_ASSISTANT'],
        requiresFeature: FEATURE.reportsTeacher,
        requiresAssistantPermissions: ['reports.view']
      }
    },
    {
      path: '/teacher/reports/history',
      name: 'teacher-reports-history',
      component: TeacherReportsView,
      meta: {
        requiresAuth: true,
        roles: ['TEACHER', 'TEACHER_ASSISTANT'],
        requiresFeature: FEATURE.reportsTeacher,
        requiresAssistantPermissions: ['reports.view']
      }
    },
    {
      path: '/teacher/offers',
      name: 'teacher-offers',
      component: TeacherOffersListView,
      meta: { requiresAuth: true, roles: ['TEACHER'], requiresFeature: FEATURE.offers }
    },
    {
      path: '/teacher/offers/new',
      name: 'teacher-offers-create',
      component: TeacherOfferEditorView,
      meta: { requiresAuth: true, roles: ['TEACHER'], requiresFeature: FEATURE.offers }
    },
    {
      path: '/teacher/offers/:id/edit',
      name: 'teacher-offers-edit',
      component: TeacherOfferEditorView,
      meta: { requiresAuth: true, roles: ['TEACHER'], requiresFeature: FEATURE.offers }
    },
    {
      path: '/teacher/landing/content',
      name: 'teacher-landing-content',
      component: TeacherLandingContentView,
      meta: { requiresAuth: true, roles: ['TEACHER'] }
    },
    {
      path: '/teacher/landing/messages',
      name: 'teacher-landing-messages',
      component: TeacherLandingMessagesView,
      meta: { requiresAuth: true, roles: ['TEACHER'] }
    },
    {
      path: '/teacher/badges',
      name: 'teacher-badges',
      component: TeacherBadgesList,
      meta: { requiresAuth: true, roles: ['TEACHER'], requiresFeature: FEATURE.badges }
    },
    {
      path: '/teacher/certificates',
      name: 'teacher-certificates',
      component: TeacherCertificatesView,
      meta: { requiresAuth: true, roles: ['TEACHER', 'TEACHER_ASSISTANT'] },
      alias: '/teacher/certificate'
    },
    {
      path: '/teacher/notifications',
      name: 'teacher-notifications',
      component: TeacherNotificationsCenter,
      meta: {
        requiresAuth: true,
        roles: ['TEACHER', 'TEACHER_ASSISTANT'],
        requiresFeature: FEATURE.notificationsUnified,
        requiresAssistantPermissions: ['communications.manage']
      }
    },
    {
      path: '/teacher/audit',
      name: 'teacher-audit',
      component: TeacherAuditView,
      meta: { requiresAuth: true, roles: ['TEACHER'], requiresFeature: FEATURE.adminOps }
    },
    {
      path: '/teacher/assistants',
      name: 'teacher-assistants',
      component: TeacherAssistantsView,
      meta: { requiresAuth: true, roles: ['TEACHER'], requiresFeature: FEATURE.teacherAssistants }
    },
    {
      path: '/teacher/plan',
      name: 'teacher-plan-upgrade',
      component: TeacherPlanUpgradeView,
      meta: { requiresAuth: true, roles: ['TEACHER'], requiresFeature: FEATURE.teacherSubscriptions }
    },
    {
      path: '/teacher/plan/checkout',
      name: 'teacher-plan-checkout',
      component: TeacherPlanCheckoutView,
      meta: { requiresAuth: true, roles: ['TEACHER'], requiresFeature: FEATURE.teacherSubscriptions }
    },
    {
      path: '/subscription/paypal-success',
      name: 'subscription-paypal-success',
      component: SubscriptionPaypalSuccessView
    },
    {
      path: '/teacher/payments/paymob/return',
      name: 'teacher-paymob-return',
      component: TeacherPlanCheckoutView
    },
    {
      path: '/admin',
      name: 'admin-console',
      component: PlatformAdminConsoleView,
      meta: { requiresAuth: true, roles: ['PLATFORM_ADMIN'] },
      alias: '/platform/console'
    },
    {
      path: '/admin/plans',
      name: 'admin-plan-builder',
      component: AdminPlanBuilder,
      meta: { requiresAuth: true, roles: ['PLATFORM_ADMIN'], requiresFeature: FEATURE.adminOps },
      alias: ['/platform/console/plans', '/admin/plans/features']
    },
    {
      path: '/admin/teachers',
      name: 'admin-teachers',
      component: AdminTeachersView,
      meta: { requiresAuth: true, roles: ['PLATFORM_ADMIN'] },
      alias: '/platform/teachers/manage'
    },
    {
      path: '/admin/students',
      name: 'admin-students',
      component: AdminStudentsView,
      meta: { requiresAuth: true, roles: ['PLATFORM_ADMIN'] },
      alias: '/platform/students'
    },
    {
      path: '/admin/platform-messages',
      name: 'admin-platform-messages',
      component: PlatformMessagesView,
      meta: { requiresAuth: true, roles: ['PLATFORM_ADMIN'] },
      alias: '/platform/messages'
    },
    {
      path: '/admin/feedback',
      name: 'admin-feedback',
      component: AdminFeedbackInboxView,
      meta: { requiresAuth: true, roles: ['PLATFORM_ADMIN'] },
      alias: '/platform/feedback'
    },
    {
      path: '/admin/publications',
      name: 'admin-publications',
      component: PlatformAdminPublicationsView,
      meta: { requiresAuth: true, roles: ['PLATFORM_ADMIN'] },
      alias: '/platform/publications'
    },
    {
      path: '/admin/analytics',
      name: 'admin-analytics-overview',
      component: AdminAnalyticsView,
      meta: { requiresAuth: true, roles: ['PLATFORM_ADMIN'], requiresFeature: FEATURE.analyticsPlatform }
    },
    {
      path: '/admin/analytics/export',
      name: 'admin-analytics-export',
      component: AdminAnalyticsExportView,
      meta: { requiresAuth: true, roles: ['PLATFORM_ADMIN'], requiresFeature: FEATURE.analyticsPlatform }
    },
    {
      path: '/admin/courses',
      name: 'admin-courses-moderation',
      component: AdminCoursesModeration,
      meta: { requiresAuth: true, roles: ['PLATFORM_ADMIN'], requiresFeature: FEATURE.adminModeration }
    },
    {
      path: '/admin/ops/backups',
      name: 'admin-ops-backups',
      component: AdminBackupsView,
      meta: { requiresAuth: true, roles: ['PLATFORM_ADMIN'], requiresFeature: FEATURE.adminOps },
      alias: '/admin/ops'
    },
    {
      path: '/admin/ops/alerts',
      name: 'admin-ops-alerts',
      component: AdminAlertsView,
      meta: { requiresAuth: true, roles: ['PLATFORM_ADMIN'], requiresFeature: FEATURE.adminOps }
    },
    {
      path: '/admin/ops/payments',
      name: 'admin-ops-payments',
      component: AdminPaymentLogsView,
      meta: { requiresAuth: true, roles: ['PLATFORM_ADMIN'], requiresFeature: FEATURE.adminOps }
    },
    {
      path: '/admin/ops/audit',
      name: 'admin-ops-audit',
      component: AdminAuditView,
      meta: { requiresAuth: true, roles: ['PLATFORM_ADMIN'], requiresFeature: FEATURE.adminOps }
    },
    {
      path: '/teacher/enrollments',
      name: 'teacher-enrollments',
      component: TeacherEnrollmentsView,
      meta: {
        requiresAuth: true,
        roles: ['TEACHER', 'TEACHER_ASSISTANT', 'PLATFORM_ADMIN'],
        requiresAssistantPermissions: ['registrations.manage']
      }
    },
    {
      path: '/student/live-sessions',
      name: 'student-live-sessions',
      component: StudentLiveSessionsList,
      meta: { requiresAuth: true, tenantBound: true, roles: ['STUDENT'] }
    },
    {
      path: '/student/live-chat',
      name: 'student-live-chat',
      component: StudentLiveChatView,
      meta: { requiresAuth: true, tenantBound: true, roles: ['STUDENT'], requiresFeature: FEATURE.liveSessionsChat }
    },
    {
      path: '/student/live-polls',
      name: 'student-live-polls',
      component: StudentLivePollsView,
      meta: { requiresAuth: true, tenantBound: true, roles: ['STUDENT'], requiresFeature: FEATURE.liveSessionsPolls }
    },
    {
      path: '/student/reports',
      name: 'student-reports',
      component: StudentReportsView,
      meta: { requiresAuth: true, tenantBound: true, roles: ['STUDENT'], requiresFeature: FEATURE.reportsStudent }
    },
    {

      path: '/student/tutoring',
      name: 'student-tutoring',
      component: StudentTutoringView,
      meta: { requiresAuth: true, tenantBound: true, roles: ['STUDENT'] }
    },
    {
      path: '/student/learning',
      name: 'student-learning',
      component: StudentLearningView,
      meta: { requiresAuth: true, tenantBound: true, roles: ['STUDENT'] }
    },
    {
      path: '/student/achievements',
      name: 'student-achievements',
      component: StudentAchievementsView,
      meta: { requiresAuth: true, tenantBound: true, roles: ['STUDENT'] }
    },
    {
      path: '/student/badges',
      name: 'student-badges',
      component: StudentBadgesView,
      meta: { requiresAuth: true, tenantBound: true, roles: ['STUDENT'], requiresFeature: FEATURE.badges }
    },
    {
      path: '/student/notifications',
      name: 'student-notifications',
      component: StudentNotificationsCenter,
      meta: { requiresAuth: true, tenantBound: true, roles: ['STUDENT'], requiresFeature: FEATURE.notificationsUnified }
    },
    {
      path: '/student/checkout',
      name: 'student-checkout',
      component: StudentCheckoutView,
      meta: { requiresAuth: true, tenantBound: true, roles: ['STUDENT'] }
    },
    {
      path: '/assistant/dashboard',
      name: 'assistant-dashboard',
      component: AssistantDashboardView,
      meta: {
        requiresAuth: true,
        roles: ['TEACHER_ASSISTANT'],
        requiresFeature: FEATURE.teacherAssistants
      },
      beforeEnter: ensureAppTenantHost
    },
    {
      path: '/assistant/courses',
      name: 'assistant-courses',
      component: CourseListView,
      meta: { requiresAuth: true, roles: ['TEACHER_ASSISTANT'], requiresAssistantPermissions: ['courses.manage'] }
    },
    {
      path: '/assistant/courses/:courseId',
      name: 'assistant-course',
      component: CourseEditorView,
      meta: { requiresAuth: true, roles: ['TEACHER_ASSISTANT'], requiresAssistantPermissions: ['courses.manage'] }
    },
    {
      path: '/assistant/courses/:courseId/modules/:moduleId/lessons/new',
      name: 'assistant-lesson-create',
      component: LessonEditorView,
      meta: { requiresAuth: true, roles: ['TEACHER_ASSISTANT'], requiresAssistantPermissions: ['courses.manage'] }
    },
    {
      path: '/assistant/courses/:courseId/modules/:moduleId/lessons/:lessonId',
      name: 'assistant-lesson-edit',
      component: LessonEditorView,
      meta: { requiresAuth: true, roles: ['TEACHER_ASSISTANT'], requiresAssistantPermissions: ['courses.manage'] }
    },
    {
      path: '/assistant/students',
      name: 'assistant-students',
      component: TeacherRosterView,
      meta: { requiresAuth: true, roles: ['TEACHER_ASSISTANT'], requiresAssistantPermissions: ['students.view'], requiresFeature: FEATURE.teacherRosterGroups }
    },
    {
      path: '/assistant/assessments',
      name: 'assistant-assessments',
      component: TeacherAssessmentsView,
      meta: { requiresAuth: true, roles: ['TEACHER_ASSISTANT'], requiresAssistantPermissions: ['assessments.manage'] }
    },
    {
      path: '/assistant/assessments/:assessmentId',
      name: 'assistant-assessment-builder',
      component: AssessmentBuilderView,
      meta: { requiresAuth: true, roles: ['TEACHER_ASSISTANT'], requiresAssistantPermissions: ['assessments.manage'] }
    },
    {
      path: '/assistant/assessments/:assessmentId/attempts',
      name: 'assistant-assessment-attempts',
      component: TeacherAssessmentAttemptsView,
      meta: { requiresAuth: true, roles: ['TEACHER_ASSISTANT'], requiresAssistantPermissions: ['assessments.manage'] }
    },
    {
      path: '/assistant/question-banks',
      name: 'assistant-question-banks',
      component: TeacherQuestionBanksView,
      meta: { requiresAuth: true, roles: ['TEACHER_ASSISTANT'], requiresAssistantPermissions: ['assessments.manage'] }
    },
    {
      path: '/assistant/enrollments',
      name: 'assistant-enrollments',
      component: TeacherEnrollmentsView,
      meta: { requiresAuth: true, roles: ['TEACHER_ASSISTANT'], requiresAssistantPermissions: ['registrations.manage'] }
    },
    {
      path: '/assistant/registrations',
      name: 'assistant-registrations',
      component: TeacherRegistrationsView,
      meta: { requiresAuth: true, roles: ['TEACHER_ASSISTANT'], requiresAssistantPermissions: ['registrations.manage'], requiresFeature: FEATURE.teacherRegsPayments }
    },
    {
      path: '/assistant/payments',
      name: 'assistant-payments',
      component: TeacherPaymentsView,
      meta: { requiresAuth: true, roles: ['TEACHER_ASSISTANT'], requiresAssistantPermissions: ['registrations.manage'], requiresFeature: FEATURE.teacherRegsPayments }
    },
    {
      path: '/assistant/tutoring',
      name: 'assistant-tutoring',
      component: TeacherTutoringView,
      meta: { requiresAuth: true, roles: ['TEACHER_ASSISTANT'], requiresAssistantPermissions: ['tutoring.manage'] }
    },
    {
      path: '/assistant/reports',
      name: 'assistant-reports',
      component: TeacherReportsOverviewView,
      meta: { requiresAuth: true, roles: ['TEACHER_ASSISTANT'], requiresAssistantPermissions: ['reports.view'], requiresFeature: FEATURE.reportsTeacher }
    },
    {
      path: '/assistant/reports/history',
      name: 'assistant-reports-history',
      component: TeacherReportsView,
      meta: { requiresAuth: true, roles: ['TEACHER_ASSISTANT'], requiresAssistantPermissions: ['reports.view'], requiresFeature: FEATURE.reportsTeacher }
    },
    {
      path: '/assistant/notifications',
      name: 'assistant-notifications',
      component: TeacherNotificationsCenter,
      meta: { requiresAuth: true, roles: ['TEACHER_ASSISTANT'], requiresAssistantPermissions: ['communications.manage'], requiresFeature: FEATURE.notificationsUnified }
    },
    {
      path: '/assistant/certificates',
      name: 'assistant-certificates',
      component: TeacherCertificatesView,
      meta: { requiresAuth: true, roles: ['TEACHER_ASSISTANT'], requiresAssistantPermissions: ['students.view'] }
    },
    {
      path: '/assistant/feedback',
      name: 'assistant-feedback-embedded',
      component: UserFeedbackView,
      props: { audience: 'assistant' },
      meta: { requiresAuth: true, roles: ['TEACHER_ASSISTANT'] }
    },
    {
      path: '/assistant',
      name: 'student-assistant',
      component: StudentAssistantView,
      meta: { requiresAuth: true, tenantBound: true, roles: ['STUDENT'] },
      alias: ['/student/assistant']
    },
    {
      path: '/login',
      name: 'smart-login',
      beforeEnter: (to) => {
        const nextParam = typeof to.query?.next === 'string' ? to.query.next : undefined;
        const legacyRedirect = typeof to.query?.redirect === 'string' ? to.query.redirect : undefined;
        const redirect = nextParam ?? legacyRedirect;

        // على app.<root> → لوجن المعلّم
        if (isAppHost()) {
          if (typeof window !== 'undefined') {
            const path = redirect && redirect.startsWith('/') ? redirect : '/teacher/login';
            window.location.replace(buildAppUrl(path));
            return false;
          }
          return { path: '/teacher/login', replace: true };
        }

        // على <tenant>.<root> → لوجن الطالب
        const path = redirect && redirect.startsWith('/') ? redirect : '/student/login';
        return { path, replace: true, query: to.query };
      },
      meta: { disableShell: true }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView
    }
  ]
});

installGuards(router);

export default router;




