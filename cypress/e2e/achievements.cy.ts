/// <reference types="cypress" />

describe('Student achievements page', () => {
  it('displays certificates, badges, and leaderboard entries', () => {
    const payload = {
      certificates: [
        {
          id: 1,
          courseId: 10,
          courseTitle: 'دورة الفيزياء',
          pdfUrl: '/static/cert.pdf',
          qrCode: 'qr',
          issuedAt: new Date().toISOString()
        }
      ],
      badges: [
        {
          id: 5,
          name: 'وسام الإكمال',
          iconUrl: '',
          description: 'لإنهاء دورة كاملة',
          earnedAt: new Date().toISOString()
        }
      ],
      leaderboard: {
        period: 'alltime',
        entries: [
          { studentId: 1, studentName: 'Achiever', rank: 1, points: 120 }
        ]
      }
    };

    cy.intercept('GET', '**/api/v1/students/achievements*', {
      statusCode: 200,
      body: payload
    }).as('getAchievements');

    cy.visit('/student/achievements', {
      onBeforeLoad(win) {
        win.localStorage.setItem('edtech_token', 'test-token');
        win.localStorage.setItem('edtech_role', 'STUDENT');
        win.localStorage.setItem('edtech_studentId', '1');
        win.localStorage.setItem('edtech_tenant', 'demo');
      }
    });

    cy.wait('@getAchievements');
    cy.contains('الإنجازات').should('be.visible');
    cy.contains('دورة الفيزياء').should('exist');
    cy.contains('وسام الإكمال').should('exist');
    cy.contains('Achiever').should('exist');
  });
});
