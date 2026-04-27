import { type RouteLocationRaw } from 'vue-router';

export interface NavItem {
    label: string;
    to?: RouteLocationRaw;
    href?: string;
    icon: string;
    badge?: string;
    external?: boolean;
}

export interface AdminNavContext {
    t: (key: string, params?: Record<string, unknown>) => string;
    isPlatformAdmin: boolean;
    platformSyndicationEnabled: boolean;
    analyticsPlatformEnabled: boolean;
    adminModerationEnabled: boolean;
    adminOpsEnabled: boolean;
}

export const buildAdminNavItems = (context: AdminNavContext): NavItem[] => {
    const {
        t,
        isPlatformAdmin,
        platformSyndicationEnabled,
        analyticsPlatformEnabled,
        adminModerationEnabled,
        adminOpsEnabled
    } = context;

    if (!isPlatformAdmin) {
        return [];
    }

    const items: NavItem[] = [
        { label: t('nav.platformPlansWorkspace'), to: '/admin/plans', icon: 'SettingOutlined' },
        { label: t('nav.adminTeachers'), to: '/admin/teachers', icon: 'IdcardOutlined' },
        { label: t('nav.adminStudents'), to: '/admin/students', icon: 'TeamOutlined' },
        { label: t('nav.adminMessages'), to: '/admin/platform-messages', icon: 'MailOutlined' },
        { label: t('nav.adminFeedback'), to: '/admin/feedback', icon: 'MessageOutlined' }
    ];

    if (platformSyndicationEnabled) {
        items.push({ label: t('nav.adminPublications'), to: '/admin/publications', icon: 'PlaySquareOutlined' });
    }

    if (analyticsPlatformEnabled) {
        items.push({ label: t('nav.adminAnalytics'), to: '/admin/analytics', icon: 'LineChartOutlined' });
    }

    if (adminModerationEnabled) {
        items.push({ label: t('nav.adminModeration'), to: '/admin/courses', icon: 'SafetyCertificateOutlined' });
    }

    if (adminOpsEnabled) {
        items.push(
            { label: t('nav.adminOps'), to: '/admin/ops/backups', icon: 'DatabaseOutlined' },
            { label: t('nav.adminOpsAlerts'), to: '/admin/ops/alerts', icon: 'WarningOutlined' },
            { label: t('nav.adminOpsPayments'), to: '/admin/ops/payments', icon: 'CreditCardOutlined' },
            { label: t('nav.adminOpsAudit'), to: '/admin/ops/audit', icon: 'FileSearchOutlined' }
        );
    }

    return items;
};
