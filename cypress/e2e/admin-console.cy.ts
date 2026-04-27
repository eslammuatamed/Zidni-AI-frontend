/// <reference types="cypress" />

describe('Platform admin console', () => {
  it('displays overview metrics and updates a teacher', () => {
    const overview = {
      teacherCount: 3,
      activeTeacherCount: 2,
      studentCount: 120,
      courseCount: 45,
      databaseSizeBytes: 2048,
      lastBackupAt: new Date().toISOString(),
      lastBackupStatus: 'COMPLETED'
    };

    cy.intercept('GET', '**/api/v1/platform/overview', overview).as('getOverview');
    cy.intercept('GET', '**/api/v1/platform/backups*', [
      {
        id: 5,
        status: 'COMPLETED',
        createdAt: new Date().toISOString(),
        storageUrl: '/static/backup.zip'
      }
    ]).as('getBackups');
    cy.intercept('GET', '**/api/v1/platform/teachers', [
      { id: 1, slug: 'alpha', name: 'Alpha Academy', subject: 'Math', plan: 'free', active: true }
    ]).as('getTeachers');
    cy.intercept('GET', '**/api/v1/platform/teachers/1', {
      id: 1,
      slug: 'alpha',
      name: 'Alpha Academy',
      subject: 'Math',
      plan: 'free',
      active: true,
      flags: {},
      studentCount: 18,
      userAccountCount: 3,
      deviceCount: 7,
      domains: [
        { id: 11, domain: 'alpha.example.com', verified: false, verificationToken: 'abc123' }
      ]
    }).as('getTeacher');
    cy.intercept('PUT', '**/api/v1/platform/teachers/1', (req) => {
      const body = req.body as Record<string, unknown>;
      req.reply({
        id: 1,
        slug: 'alpha',
        name: (body.name as string) || 'Alpha Academy',
        subject: (body.subject as string) || 'Math',
        plan: (body.plan as string) || 'free',
        active: (body.active as boolean) ?? true,
        flags: body.flags ?? {},
        studentCount: 18,
        userAccountCount: 3,
        deviceCount: 7,
        domains: [
          { id: 11, domain: 'alpha.example.com', verified: false, verificationToken: 'abc123' }
        ]
      });
    }).as('updateTeacher');
    cy.intercept('PUT', '**/api/v1/platform/teachers/1/slug', {
      id: 1,
      slug: 'alpha-updated',
      name: 'Alpha Academy',
      subject: 'Math',
      plan: 'pro',
      active: false,
      flags: {},
      studentCount: 18,
      userAccountCount: 3,
      deviceCount: 7,
      domains: [
        { id: 11, domain: 'alpha.example.com', verified: false, verificationToken: 'abc123' }
      ]
    }).as('updateSlug');
    cy.intercept('POST', '**/api/v1/platform/teachers/1/domains', {
      id: 12,
      domain: 'learn.alpha.com',
      verified: false,
      verificationToken: 'verify-me'
    }).as('addDomain');
    cy.intercept('POST', '**/api/v1/platform/backups', {
      id: 6,
      status: 'RUNNING',
      createdAt: new Date().toISOString(),
      storageKey: 'platform-backup.zip'
    }).as('triggerBackup');

    cy.visit('/platform/console', {
      onBeforeLoad(win) {
        win.localStorage.setItem('edtech_token', 'admin-token');
        win.localStorage.setItem('edtech_role', 'PLATFORM_ADMIN');
      }
    });

    cy.wait(['@getTeachers', '@getOverview', '@getBackups']);
    cy.contains('Alpha Academy').click();
    cy.wait('@getTeacher');

    cy.get('input[label="Teacher name"], input[label="اسم المعلم"]').first().clear().type('Alpha Academy Updated');
    cy.get('input[label="Subject"], input[label="المادة"]').first().clear().type('Science');
    cy.get('input[label="Custom slug"], input[label="النطاق"]').first().clear().type('alpha-updated');

    cy.contains(/Save|حفظ/).click();
    cy.wait('@updateTeacher');

    cy.contains(/Update slug|تحديث النطاق/).click();
    cy.wait('@updateSlug');

    cy.get('input[label="Domain"], input[label="نطاق"]').first().type('learn.alpha.com');
    cy.contains(/Add domain|إضافة نطاق/).click();
    cy.wait('@addDomain');

    cy.contains(/Trigger backup|تنفيذ نسخة احتياطية/).click();
    cy.wait('@triggerBackup');

    cy.contains(/Database backups|النسخ الاحتياطية/);
    cy.contains('Alpha Academy Updated');
  });
});
