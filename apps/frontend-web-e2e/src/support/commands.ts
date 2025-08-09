/// <reference types="cypress" />
export {};

// Ensure TS knows about our custom commands in this compilation unit
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    interface Chainable<Subject = any> {
      loginByUI(email: string, password: string): Chainable<void>;
      loginByApi(email: string, password: string): Chainable<void>;
      registerByApi(email: string, password: string): Chainable<void>;
      logout(): Chainable<void>;
    }
  }
}

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// -- UI login command --
Cypress.Commands.add('loginByUI', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('input[formcontrolname="email"]').type(email);
  cy.get('input[formcontrolname="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.location('pathname').should('include', '/dashboard');
});

// -- API login command --
Cypress.Commands.add('loginByApi', (email: string, password: string) => {
  cy.request('POST', 'http://localhost:3333/api/auth/login', { email, password }).then((resp) => {
    expect(resp.status).to.be.oneOf([200, 201]);
    const body = resp.body as { accessToken?: string };
    const token = body.accessToken ?? '';
    expect(token).to.be.a('string');
    window.localStorage.setItem('auth_token', token);
  });
});

// -- API register command --
Cypress.Commands.add('registerByApi', (email: string, password: string) => {
  cy.request({
    method: 'POST',
    url: 'http://localhost:3333/api/auth/register',
    body: { email, password },
    failOnStatusCode: false, // allow 400 for existing users
  }).then((resp) => {
    expect([200, 201, 400]).to.include(resp.status);
  });
});

// -- Logout command --
Cypress.Commands.add('logout', () => {
  window.localStorage.removeItem('auth_token');
  // keep command chainable positionally without returning a value
  cy.wrap(undefined);
});
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })
