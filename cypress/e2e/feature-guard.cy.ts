/// <reference types="cypress" />

describe('Feature guard routing', () => {
  it('redirects when a required feature is disabled and allows access after refresh', () => {
    let callCount = 0;
    cy.intercept('GET', '**/api/v1/features', (req) => {
      callCount += 1;
      if (callCount === 1) {
        req.reply({
          plan: 'PRO',
          version: 1,
          features: {
            teacherRegsPayments: false,
            teacherRosterGroups: true
          },
          entitlements: {
            student_limit: 100
          }
        });
      } else {
        req.reply({
          plan: 'PRO',
          version: 1,
          features: {
            teacherRegsPayments: true,
            teacherRosterGroups: true
          },
          entitlements: {
            student_limit: 100
          }
        });
      }
    }).as('getFeatures');

    cy.intercept({ method: 'GET', url: '**/api/**' }, (req) => {
      if (req.url.includes('/api/v1/features')) {
        return;
      }
      req.reply({});
    });

    cy.visit('/teacher/payments', {
      onBeforeLoad(win) {
        win.localStorage.setItem('edtech_token', 'teacher-token');
        win.localStorage.setItem('edtech_role', 'TEACHER');
      }
    });

    cy.wait('@getFeatures');
    cy.url().should('include', '/teacher');
    cy.get('.ui-toast').contains('This feature is disabled for your plan.');

    cy.visit('/teacher/payments');
    cy.wait('@getFeatures');
    cy.url().should('include', '/teacher/payments');
  });
});
