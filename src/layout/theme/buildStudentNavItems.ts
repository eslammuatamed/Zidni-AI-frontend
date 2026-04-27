import { type RouteLocationRaw } from 'vue-router';
import { type Ref } from 'vue';

export interface NavItem {
    label: string;
    to?: RouteLocationRaw;
    href?: string;
    icon: string;
    badge?: string;
    external?: boolean;
    action?: 'open-teacher-terms'; // Keep structure consistent
}

export interface StudentNavBuildContext {
    t: (key: string, params?: Record<string, unknown>) => string;
    isStudent: boolean;
    isTeacher: boolean;
    studentReportsEnabled: boolean;
    badgesEnabled: boolean;
    notificationsUnifiedEnabled: boolean;
    notificationsBadgeLabel?: string;
    englishLabEnabled: boolean;
    offersEnabled: boolean;
}

export const buildStudentNavItems = (context: StudentNavBuildContext): NavItem[] => {
    const {
        t,
        isStudent,
        isTeacher,
        studentReportsEnabled,
        badgesEnabled,
        notificationsUnifiedEnabled,
        notificationsBadgeLabel,
        englishLabEnabled,
        offersEnabled
    } = context;

    if (isStudent) {
        const items: NavItem[] = [
            { label: t('nav.student'), to: '/student/home', icon: 'SolutionOutlined' },
            { label: t('nav.studentTeacherCourses'), to: '/student/teacher-courses', icon: 'ReadOutlined' },
            { label: t('nav.studentAssessments'), to: '/student/assessments', icon: 'AuditOutlined' }
        ];

        if (studentReportsEnabled) {
            items.push({ label: t('nav.studentReports'), to: '/student/reports', icon: 'LineChartOutlined' });
        }

        if (badgesEnabled) {
            items.push({ label: t('nav.studentBadges'), to: '/student/badges', icon: 'TrophyOutlined' });
        }

        if (notificationsUnifiedEnabled) {
            items.push({
                label: t('nav.studentNotifications'),
                to: '/student/notifications',
                icon: 'NotificationOutlined',
                badge: notificationsBadgeLabel
            });
        }

        items.push({ label: t('nav.studentFeedback'), to: '/student/feedback', icon: 'CommentOutlined' });

        if (englishLabEnabled) {
            items.push({ label: t('nav.studentEnglishLab'), to: '/student/english-lab', icon: 'BookOutlined' });
        }

        if (offersEnabled) {
            items.push({ label: t('nav.studentCheckout'), to: '/student/checkout', icon: 'ShoppingCartOutlined' });
        }

        return items;
    }

    if (!isTeacher) {
        return [{ label: t('nav.student'), to: '/student/login', icon: 'UserAddOutlined' }];
    }

    return [];
};
