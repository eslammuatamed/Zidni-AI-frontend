import type { ComposerTranslation } from 'vue-i18n';
import type { RouteLocationRaw } from 'vue-router';

export interface NavItem {
    label: string;
    to?: RouteLocationRaw;
    href?: string;
    icon: string;
    badge?: string;
    external?: boolean;
    action?: 'logout';
}

export interface AssistantNavBuildContext {
    t: ComposerTranslation;
    isAssistant: boolean;
    assistantPermissions: Set<string>;
    featuresUnauthorized: boolean;
    // Feature flags
    teacherRosterEnabled: boolean;
    teacherRegsPaymentsEnabled: boolean;
    teacherReportsEnabled: boolean;
    notificationsUnifiedEnabled: boolean;
    notificationsBadgeLabel: string | null | undefined;
}

export const buildAssistantNavItems = ({
    t,
    isAssistant,
    assistantPermissions,
    featuresUnauthorized,
    teacherRosterEnabled,
    teacherRegsPaymentsEnabled,
    teacherReportsEnabled,
    notificationsUnifiedEnabled,
    notificationsBadgeLabel
}: AssistantNavBuildContext): NavItem[] => {
    if (!isAssistant) {
        return [];
    }

    const items: NavItem[] = [];

    const can = (permission: string) => assistantPermissions.has(permission);

    // Live Sessions (assistant landing page)
    items.push({
        label: t('nav.teacherLiveSessions'),
        to: '/assistant/live-sessions',
        icon: 'VideoCameraOutlined'
    });

    // Courses
    if (can('courses.manage')) {
        items.push({
            label: t('courses.title'),
            to: '/assistant/courses',
            icon: 'ReadOutlined'
        });
    }

    // Students
    if (teacherRosterEnabled && can('students.view')) {
        items.push({
            label: t('nav.teacherStudents'),
            to: '/assistant/students',
            icon: 'TeamOutlined'
        });
    }

    // Assessments
    if (can('assessments.manage')) {
        items.push({
            label: t('nav.teacherAssessments'),
            to: '/assistant/assessments',
            icon: 'FileTextOutlined'
        });
        items.push({
            label: t('nav.teacherQuestionBanks'),
            to: '/assistant/question-banks',
            icon: 'DatabaseOutlined'
        });
    }

    // Registrations & Payments
    if (can('registrations.manage')) {
        if (teacherRegsPaymentsEnabled) {
            items.push({ label: t('nav.teacherEnrollments'), to: '/assistant/enrollments', icon: 'TeamOutlined' });
            items.push({ label: t('nav.teacherRegistrations'), to: '/assistant/registrations', icon: 'IdcardOutlined' });
            items.push({ label: t('nav.teacherPayments'), to: '/assistant/payments', icon: 'DollarOutlined' });
        } else {
            items.push({ label: t('nav.teacherEnrollments'), to: '/assistant/enrollments', icon: 'TeamOutlined' });
        }
    }

    // Tutoring
    if (can('tutoring.manage')) {
        items.push({ label: t('nav.teacherTutoring'), to: '/assistant/tutoring', icon: 'MessageOutlined' });
    }

    // Reports
    if (teacherReportsEnabled && can('reports.view')) {
        items.push({ label: t('nav.teacherReports'), to: '/assistant/reports', icon: 'LineChartOutlined' });
    }

    // Certificates
    if (can('students.view')) {
        items.push({
            label: t('nav.teacherCertificates'),
            to: '/assistant/certificates',
            icon: 'SafetyCertificateOutlined'
        });
    }

    // Notifications
    if (notificationsUnifiedEnabled && can('communications.manage')) {
        items.push({
            label: t('nav.teacherNotifications'),
            to: '/assistant/notifications',
            icon: 'BellOutlined',
            badge: notificationsBadgeLabel || undefined
        });
    }

    // Feedback (Generic)
    items.push({
        label: t('nav.teacherFeedback'),
        to: '/assistant/feedback',
        icon: 'CommentOutlined'
    });

    items.push({
        label: t('nav.logout'),
        icon: 'LogoutOutlined',
        action: 'logout'
    });

    return items;
};
