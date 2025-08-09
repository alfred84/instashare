/// <reference types="cypress" />

declare namespace Cypress {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Chainable<Subject = any> {
    loginByUI(email: string, password: string): void;
    loginByApi(email: string, password: string): void;
    registerByApi(email: string, password: string): void;
    logout(): void;
  }
}
