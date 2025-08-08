describe('Login page smoke', () => {
  it('shows the Login form', () => {
    cy.visit('/login');
    cy.contains('mat-card-title', 'Login');
    cy.get('button[type="submit"]').should('be.disabled');
  });
});
