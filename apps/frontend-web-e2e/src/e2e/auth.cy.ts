export {};

function fakeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.`;
}

describe('Auth UI with API stubs', () => {
  beforeEach(() => {
    const token = fakeJwt({ userId: 'u1', email: 'stub@e.com', exp: Math.floor(Date.now() / 1000) + 3600 });
    cy.intercept('POST', 'http://localhost:3333/api/auth/login', {
      statusCode: 200,
      body: { accessToken: token },
    }).as('login');

    cy.intercept('GET', 'http://localhost:3333/api/files', {
      statusCode: 200,
      body: [],
    }).as('getFiles');
  });

  it('logs in via UI and lands on dashboard (stubbed)', () => {
    cy.visit('/login');

    cy.get('input[formcontrolname="email"]').type('stub@e.com');
    cy.get('input[formcontrolname="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    cy.wait('@login');
    cy.location('pathname').should('include', '/dashboard');
    cy.wait('@getFiles');
    cy.get('.no-files-message').should('contain.text', "You haven't uploaded any files yet.");
  });
});
