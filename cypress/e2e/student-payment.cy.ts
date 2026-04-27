/// <reference types="cypress" />

describe('Student manual payment approval flow', () => {
  it('submits a payment and receives approval', () => {
    const slug = `cy-${Date.now()}`;
    const teacherEmail = `${slug}@teacher.local`;
    const teacherPassword = 'Teacher#123';
    const studentEmail = `${slug}@student.local`;
    const studentPassword = 'Student#123';
    const domain = Cypress.env('tenantDomain') || '127.0.0.1.nip.io';
    const apiPort = Cypress.env('apiPort') || '8080';
    const platformApi = () => `http://app.${domain}:${apiPort}`;
    const tenantApi = (tenant: string) => `http://${tenant}.${domain}:${apiPort}`;

    cy.request('POST', `${platformApi()}/api/v1/auth/login`, {
      email: 'admin@edtech.local',
      password: 'ChangeMe123!'
    }).then((adminResponse) => {
      const adminToken = adminResponse.body.token as string;

      return cy
        .request({
          method: 'POST',
          url: `${platformApi()}/api/v1/platform/teachers`,
          headers: { Authorization: `Bearer ${adminToken}` },
          body: {
            slug,
            name: 'Cypress Teacher',
            subject: 'Automation',
            plan: 'basic',
            email: teacherEmail,
            password: teacherPassword
          }
        })
        .then(() => cy.request({
          method: 'POST',
          url: `${tenantApi(slug)}/api/v1/auth/login`,
          body: { email: teacherEmail, password: teacherPassword }
        }))
        .then((teacherResponse) => {
          const teacherToken = teacherResponse.body.token as string;
          return cy
            .request({
              method: 'POST',
              url: `${tenantApi(slug)}/api/v1/teacher/courses`,
              headers: {
                Authorization: `Bearer ${teacherToken}`
              },
              body: {
                title: 'Cypress Course',
                type: 'recorded',
                price: 49.99,
                description: 'Course generated during Cypress run'
              }
            })
            .then((courseResponse) => ({ teacherToken, courseId: courseResponse.body.id as number }));
        })
        .then(({ teacherToken, courseId }) => {
          return cy
            .request({
              method: 'POST',
              url: `${tenantApi(slug)}/api/v1/students/register`,
              body: {
                email: studentEmail,
                name: 'Cypress Student',
                password: studentPassword
              }
            })
            .then(() =>
              cy.request({
                method: 'POST',
                url: `${tenantApi(slug)}/api/v1/auth/login`,
                body: { email: studentEmail, password: studentPassword }
              })
            )
            .then((studentLogin) => {
              const studentToken = studentLogin.body.token as string;
              return cy
                .request({
                  method: 'POST',
                  url: `${tenantApi(slug)}/api/v1/students/payments/proof`,
                  headers: {
                    Authorization: `Bearer ${studentToken}`
                  },
                  form: true,
                  body: {
                    file: {
                      fileName: 'receipt.txt',
                      mimeType: 'text/plain',
                      contents: 'automation-proof'
                    }
                  }
                })
                .then((proofResponse) => ({ studentToken, teacherToken, courseId, proof: proofResponse.body }));
            });
        });
    })
      .then(({ studentToken, teacherToken, courseId, proof }) => {
        return cy
          .request({
            method: 'POST',
            url: `${tenantApi(slug)}/api/v1/students/payments`,
            headers: {
              Authorization: `Bearer ${studentToken}`
            },
            body: {
              courseId,
              amount: 49.99,
              method: 'transfer',
              proofUrl: proof.url,
              proofKey: proof.key
            }
          })
          .then((paymentResponse) => ({ studentToken, teacherToken, paymentId: paymentResponse.body.id as number }));
      })
      .then(({ studentToken, teacherToken, paymentId }) => {
        return cy
          .request({
            method: 'POST',
            url: `${tenantApi(slug)}/api/v1/teacher/payments/bulk-decision`,
            headers: {
              Authorization: `Bearer ${teacherToken}`
            },
            body: {
              paymentIds: [paymentId],
              status: 'approved'
            }
          })
          .then(() =>
            cy.request({
              method: 'GET',
              url: `${tenantApi(slug)}/api/v1/students/enrollments`,
              headers: {
                Authorization: `Bearer ${studentToken}`
              }
            })
          )
          .its('body')
          .should((enrollments: any[]) => {
            expect(enrollments[0].status).to.eq('active');
          });
      });
  });
});
