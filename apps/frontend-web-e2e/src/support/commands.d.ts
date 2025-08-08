/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    loginByUI(email: string, password: string): Chainable<void>;
    loginByApi(email: string, password: string): Chainable<void>;
    registerByApi(email: string, password: string): Chainable<void>;
    logout(): Chainable<void>;
  }
}
