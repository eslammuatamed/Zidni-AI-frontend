import { describe, expect, it } from 'vitest';
import {
  buildTeacherNavModel,
  buildTeacherNavItems,
  type TeacherNavBuildContext
} from '../buildTeacherNavItems';

describe('buildTeacherNavItems', () => {
  const baseContext: TeacherNavBuildContext = {
    t: (key: string) => key,
    isTeacher: false,
    isAssistant: true,
    assistantPermissions: new Set<string>(),
    featuresUnauthorized: false,
    teacherLandingUrl: '',
    teacherRosterEnabled: false,
    liveSessionsCoreEnabled: false,
    liveSessionsChatEnabled: false,
    liveSessionsPollsEnabled: false,
    teacherAssistantsEnabled: false,
    teacherRegsPaymentsEnabled: false,
    teacherPaymentSettingsAvailable: false,
    adminOpsEnabled: false,
    teacherReportsEnabled: false,
    offersEnabled: false,
    englishLabEnabled: false,
    badgesEnabled: false,
    notificationsUnifiedEnabled: false,
    examWorkflowsEnabled: false,
    notificationsBadgeLabel: null,
    landingInquiryBadgeLabel: null
  };

  it('includes assistant links when feature flags fail to load but permissions allow access', () => {
    const context: TeacherNavBuildContext = {
      ...baseContext,
      featuresUnauthorized: true,
      teacherRegsPaymentsEnabled: true,
      assistantPermissions: new Set([
        'students.view',
        'registrations.manage',
        'communications.manage',
        'courses.manage',
        'reports.view'
      ])
    };

    const items = buildTeacherNavItems(context);
    const labels = items.map((item) => item.label);

    expect(labels).toContain('nav.teacherStudents');
    expect(labels).toContain('nav.teacherRegistrations');
    expect(labels).toContain('nav.teacherPayments');
    expect(labels).not.toContain('nav.teacherPaymentSettings');
    expect(labels).toContain('nav.teacherNotifications');
    expect(labels).toContain('nav.teacherReports');
    expect(labels).toContain('nav.teacherFeedback');
  });

  it('includes payment settings for teachers managing registrations', () => {
    const context: TeacherNavBuildContext = {
      ...baseContext,
      isTeacher: true,
      isAssistant: false,
      teacherRegsPaymentsEnabled: true,
      teacherPaymentSettingsAvailable: true
    };

    const labels = buildTeacherNavItems(context).map((item) => item.label);

    expect(labels).toContain('nav.teacherRegistrations');
    expect(labels).toContain('nav.teacherPayments');
    expect(labels).toContain('nav.teacherPaymentSettings');
  });

  it('includes payment settings when manual instructions are available without registrations feature', () => {
    const context: TeacherNavBuildContext = {
      ...baseContext,
      isTeacher: true,
      isAssistant: false,
      teacherRegsPaymentsEnabled: false,
      teacherPaymentSettingsAvailable: true
    };

    const labels = buildTeacherNavItems(context).map((item) => item.label);

    expect(labels).toContain('nav.teacherPaymentSettings');
    expect(labels).not.toContain('nav.teacherRegistrations');
    expect(labels).not.toContain('nav.teacherPayments');
  });

  it('omits assistant links when permissions are missing during feature load failures', () => {
    const context: TeacherNavBuildContext = {
      ...baseContext,
      featuresUnauthorized: true,
      assistantPermissions: new Set()
    };

    const items = buildTeacherNavItems(context);
    const labels = items.map((item) => item.label);

    expect(labels).not.toContain('nav.teacherStudents');
    expect(labels).not.toContain('nav.teacherRegistrations');
    expect(labels).not.toContain('nav.teacherNotifications');
  });

  it('collects suppressed navigation items when features are disabled for assistants', () => {
    const context: TeacherNavBuildContext = {
      ...baseContext,
      assistantPermissions: new Set([
        'courses.manage',
        'registrations.manage',
        'reports.view',
        'communications.manage'
      ]),
      teacherRegsPaymentsEnabled: false,
      teacherReportsEnabled: false,
      notificationsUnifiedEnabled: false
    };

    const model = buildTeacherNavModel(context);
    const suppressedLabels = model.suppressed.map((item) => item.label);

    expect(suppressedLabels).toContain('nav.teacherRegistrations');
    expect(suppressedLabels).toContain('nav.teacherPayments');
    expect(suppressedLabels).toContain('nav.teacherReports');
    expect(suppressedLabels).toContain('nav.teacherNotifications');
  });

  it('excludes teacher-only items for assistants even when features are enabled', () => {
    const context: TeacherNavBuildContext = {
      ...baseContext,
      isTeacher: false,
      assistantPermissions: new Set(['courses.manage', 'students.view', 'assessments.manage', 'registrations.manage', 'reports.view']),
      teacherRosterEnabled: true,
      liveSessionsCoreEnabled: true,
      liveSessionsChatEnabled: true,
      liveSessionsPollsEnabled: true,
      offersEnabled: true,
      englishLabEnabled: true,
      badgesEnabled: true,
      teacherReportsEnabled: true
    };

    const labels = buildTeacherNavItems(context).map((item) => item.label);

    expect(labels).toContain('courses.title');
    expect(labels).not.toContain('nav.teacherLiveSessions');
    expect(labels).not.toContain('nav.teacherLiveModeration');
    expect(labels).not.toContain('nav.teacherLivePolls');
    expect(labels).not.toContain('nav.teacherOffers');
    expect(labels).not.toContain('nav.teacherEnglishLab');
    expect(labels).not.toContain('nav.teacherBadges');
  });
});
