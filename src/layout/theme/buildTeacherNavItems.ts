import type { ComposerTranslation } from 'vue-i18n';
import type { RouteLocationRaw } from 'vue-router';

export interface NavItem {
  label: string;
  to?: RouteLocationRaw;
  href?: string;
  icon: string;
  badge?: string;
  external?: boolean;
  action?: 'open-teacher-terms';
}

export interface TeacherNavSuppressedItem {
  id: string;
  label: string;
  reason: 'feature-disabled' | 'missing-permission';
  permission?: string;
}

export interface TeacherNavBuildResult {
  items: NavItem[];
  suppressed: TeacherNavSuppressedItem[];
}

export interface TeacherNavBuildContext {
  t: ComposerTranslation;
  isTeacher: boolean;
  isAssistant: boolean;
  assistantPermissions: Set<string> | null;
  featuresUnauthorized: boolean;
  teacherLandingUrl: string;
  teacherRosterEnabled: boolean;
  liveSessionsCoreEnabled: boolean;
  liveSessionsChatEnabled: boolean;
  liveSessionsPollsEnabled: boolean;
  teacherAssistantsEnabled: boolean;
  teacherRegsPaymentsEnabled: boolean;
  teacherPaymentSettingsAvailable: boolean;
  teacherReportsEnabled: boolean;
  offersEnabled: boolean;
  adminOpsEnabled: boolean;
  englishLabEnabled: boolean;
  badgesEnabled: boolean;
  notificationsUnifiedEnabled: boolean;
  examWorkflowsEnabled: boolean;
  notificationsBadgeLabel: string | null | undefined;
  landingInquiryBadgeLabel: string | null | undefined;
}

export const buildTeacherNavModel = ({
  t,
  isTeacher,
  isAssistant,
  assistantPermissions,
  featuresUnauthorized,
  teacherLandingUrl,
  teacherRosterEnabled,
  liveSessionsCoreEnabled,
  liveSessionsChatEnabled,
  liveSessionsPollsEnabled,
  teacherAssistantsEnabled,
  teacherRegsPaymentsEnabled,
  teacherReportsEnabled,
  offersEnabled,
  adminOpsEnabled,
  englishLabEnabled,
  badgesEnabled,
  notificationsUnifiedEnabled,
  examWorkflowsEnabled,
  notificationsBadgeLabel,
  landingInquiryBadgeLabel
}: TeacherNavBuildContext): TeacherNavBuildResult => {
  if (!isTeacher && !isAssistant) {
    return { items: [], suppressed: [] };
  }

  const items: NavItem[] = [];
  const suppressed: TeacherNavSuppressedItem[] = [];

  const can = (permission?: string) => {
    if (!assistantPermissions) {
      return true;
    }
    if (!permission) {
      return true;
    }
    return assistantPermissions.has(permission);
  };

  const bypassFeatureFlags = featuresUnauthorized && isAssistant;
  const allows = (flag: boolean, permission?: string) => {
    if (!can(permission)) {
      return false;
    }
    if (flag) {
      return true;
    }
    return bypassFeatureFlags;
  };

  const recordSuppressed = (id: string, labelKey: string, reason: TeacherNavSuppressedItem['reason'], permission?: string) => {
    if (!isAssistant) {
      return;
    }
    suppressed.push({
      id,
      label: t(labelKey),
      reason,
      permission
    });
  };

  if (teacherLandingUrl) {
    items.push({
      label: t('nav.teacherLandingPublic'),
      href: teacherLandingUrl,
      icon: 'GlobalOutlined',
      external: true
    });
  }

  if (can('courses.manage')) {
    items.push({ label: t('courses.title'), to: '/teacher/courses', icon: 'ReadOutlined' });
  } else {
    recordSuppressed('courses', 'courses.title', 'missing-permission', 'courses.manage');
  }

  if (allows(teacherRosterEnabled, 'students.view')) {
    items.push({ label: t('nav.teacherStudents'), to: '/teacher/roster', icon: 'TeamOutlined' });
  } else if (isAssistant) {
    if (can('students.view')) {
      recordSuppressed('roster', 'nav.teacherStudents', 'feature-disabled');
    } else {
      recordSuppressed('roster', 'nav.teacherStudents', 'missing-permission', 'students.view');
    }
  }

  if (isTeacher && allows(liveSessionsCoreEnabled)) {
    items.push({ label: t('nav.teacherLiveSessions'), to: '/teacher/live-sessions', icon: 'VideoCameraOutlined' });
  }
  if (isTeacher && allows(liveSessionsChatEnabled)) {
    items.push({ label: t('nav.teacherLiveModeration'), to: '/teacher/live-moderation', icon: 'MessageOutlined' });
  }
  if (isTeacher && allows(liveSessionsPollsEnabled)) {
    items.push({ label: t('nav.teacherLivePolls'), to: '/teacher/live-polls', icon: 'BarChartOutlined' });
  }

  if (can('tutoring.manage')) {
    items.push({ label: t('nav.teacherTutoring'), to: '/teacher/tutoring', icon: 'MessageOutlined' });
  } else {
    recordSuppressed('tutoring', 'nav.teacherTutoring', 'missing-permission', 'tutoring.manage');
  }

  if (can('assessments.manage')) {
    items.push({
      label: examWorkflowsEnabled ? t('nav.teacherExams') : t('nav.teacherAssessments'),
      to: '/teacher/assessments',
      icon: 'FileTextOutlined'
    });
    items.push({ label: t('nav.teacherQuestionBanks'), to: '/teacher/question-banks', icon: 'DatabaseOutlined' });
  } else {
    recordSuppressed('assessments', 'nav.teacherAssessments', 'missing-permission', 'assessments.manage');
  }

  if (can('registrations.manage')) {
    items.push({ label: t('nav.teacherEnrollments'), to: '/teacher/enrollments', icon: 'TeamOutlined' });
  } else {
    recordSuppressed('enrollments', 'nav.teacherEnrollments', 'missing-permission', 'registrations.manage');
  }

  const canManageRegistrations = allows(teacherRegsPaymentsEnabled, 'registrations.manage');
  if (canManageRegistrations) {
    items.push({ label: t('nav.teacherRegistrations'), to: '/teacher/registrations', icon: 'IdcardOutlined' });
    items.push({ label: t('nav.teacherPayments'), to: '/teacher/payments', icon: 'DollarOutlined' });
  } else if (isAssistant && can('registrations.manage')) {
    recordSuppressed('registrations', 'nav.teacherRegistrations', 'feature-disabled');
    recordSuppressed('payments', 'nav.teacherPayments', 'feature-disabled');
  }

  if (isTeacher) {
    items.push({ label: t('nav.teacherPaymentSettings'), to: '/teacher/payments/manual-settings', icon: 'WalletOutlined' });
  }

  if (allows(teacherReportsEnabled, 'reports.view')) {
    items.push({ label: t('nav.teacherReports'), to: '/teacher/reports', icon: 'LineChartOutlined' });
  } else if (isAssistant) {
    if (can('reports.view')) {
      recordSuppressed('reports', 'nav.teacherReports', 'feature-disabled');
    } else {
      recordSuppressed('reports', 'nav.teacherReports', 'missing-permission', 'reports.view');
    }
  }

  if (isTeacher && allows(offersEnabled)) {
    items.push({ label: t('nav.teacherOffers'), to: '/teacher/offers', icon: 'TagOutlined' });
  }

  if (adminOpsEnabled && isTeacher) {
    items.push({ label: t('nav.teacherAudit'), to: '/teacher/audit', icon: 'FileSearchOutlined' });
  }

  if (isTeacher) {
    items.push({ label: t('nav.teacherLandingContent'), to: '/teacher/landing/content', icon: 'AppstoreOutlined' });
    if (teacherAssistantsEnabled) {
      items.push({ label: t('nav.teacherAssistants'), to: '/teacher/assistants', icon: 'UserSwitchOutlined' });
    }
  }

  if (isTeacher && allows(englishLabEnabled)) {
    items.push({ label: t('nav.teacherEnglishLab'), to: '/teacher/english-lab', icon: 'BookOutlined' });
  }

  if (isTeacher && allows(badgesEnabled, 'courses.manage')) {
    items.push({ label: t('nav.teacherBadges'), to: '/teacher/badges', icon: 'TrophyOutlined' });
  }

  items.push({ label: t('nav.teacherCertificates'), to: '/teacher/certificates', icon: 'SafetyCertificateOutlined' });

  items.push({
    label: t('nav.teacherFeedback'),
    to: isTeacher ? '/teacher/feedback' : '/assistant/feedback',
    icon: 'CommentOutlined'
  });

  if (isTeacher) {
    items.push({
      label: t('nav.teacherLandingMessages'),
      to: '/teacher/landing/messages',
      icon: 'MailOutlined',
      badge: landingInquiryBadgeLabel || undefined
    });
  }

  if (allows(notificationsUnifiedEnabled, 'communications.manage')) {
    items.push({
      label: t('nav.teacherNotifications'),
      to: '/teacher/notifications',
      icon: 'BellOutlined',
      badge: notificationsBadgeLabel || undefined
    });
  } else if (isAssistant) {
    if (can('communications.manage')) {
      recordSuppressed('notifications', 'nav.teacherNotifications', 'feature-disabled');
    } else {
      recordSuppressed('notifications', 'nav.teacherNotifications', 'missing-permission', 'communications.manage');
    }
  }

  return { items, suppressed };
};

export const buildTeacherNavItems = (context: TeacherNavBuildContext): NavItem[] =>
  buildTeacherNavModel(context).items;
