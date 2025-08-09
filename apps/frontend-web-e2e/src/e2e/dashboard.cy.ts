export {};

function fakeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.`;
}

describe('Dashboard flows (stubbed backend)', () => {
  const fileId = 'f1';

  beforeEach(() => {
    // Token seeding moved into each test before visiting to ensure intercepts capture initial requests
  });

  it('loads files and shows empty state', () => {
    const token = fakeJwt({ userId: 'u1', email: 'stub@e.com', exp: Math.floor(Date.now() / 1000) + 3600 });
    cy.intercept('GET', '**/api/files*', { statusCode: 200, body: [] }).as('getFiles');
    cy.visit('/dashboard', {
      onBeforeLoad(win) {
        win.localStorage.setItem('auth_token', token);
      },
    });
    cy.wait('@getFiles');
    cy.get('.no-files-message').should('contain.text', "You haven't uploaded any files yet.");
  });

  it('uploads a file and refreshes list', () => {
    // Start with empty list, then after upload respond with 1 file
    const token = fakeJwt({ userId: 'u1', email: 'stub@e.com', exp: Math.floor(Date.now() / 1000) + 3600 });
    cy.intercept('GET', '**/api/files*', { statusCode: 200, body: [] }).as('getFiles1');
    cy.visit('/dashboard', {
      onBeforeLoad(win) {
        win.localStorage.setItem('auth_token', token);
      },
    });
    cy.wait('@getFiles1');

    cy.intercept('POST', '**/api/files/upload', {
      statusCode: 200,
      body: { id: fileId, originalName: 'sample.txt', size: 5, mimeType: 'text/plain', createdAt: new Date().toISOString(), status: 'PROCESSING' },
    }).as('upload');

    // After upload, the component calls loadFiles again
    cy.intercept('GET', '**/api/files*', {
      statusCode: 200,
      body: [{ id: fileId, originalName: 'sample.txt', size: 5, mimeType: 'text/plain', createdAt: new Date().toISOString(), status: 'COMPLETED' }],
    }).as('getFiles2');

    // Upload via fixture content
    cy.fixture('sample.txt', 'utf8').then((text) => {
      const blob = new Blob([text], { type: 'text/plain' });
      cy.get('input[type="file"]').selectFile({ contents: blob, fileName: 'sample.txt', mimeType: 'text/plain' }, { force: true });
    });

    cy.wait('@upload');
    cy.wait('@getFiles2');
    cy.contains('mat-list-item div[matListItemTitle]', 'sample.txt').should('exist');
  });

  it('renames a file via dialog', () => {
    const token = fakeJwt({ userId: 'u1', email: 'stub@e.com', exp: Math.floor(Date.now() / 1000) + 3600 });
    // Seed list with one file
    cy.intercept('GET', '**/api/files*', {
      statusCode: 200,
      body: [{ id: fileId, originalName: 'sample.txt', size: 5, mimeType: 'text/plain', createdAt: new Date().toISOString(), status: 'COMPLETED' }],
    }).as('getFiles');

    // Visit to apply intercept
    cy.visit('/dashboard', {
      onBeforeLoad(win) {
        win.localStorage.setItem('auth_token', token);
      },
    });
    cy.wait('@getFiles');

    cy.intercept('PATCH', `**/api/files/${fileId}/rename`, (req) => {
      expect(req.body).to.deep.equal({ newName: 'renamed.txt' });
      req.reply({
        statusCode: 200,
        body: { id: fileId, originalName: 'renamed.txt', size: 5, mimeType: 'text/plain', createdAt: new Date().toISOString(), status: 'COMPLETED' },
      });
    }).as('rename');

    // Open rename dialog by clicking the edit button
    cy.contains('button', 'edit').click();

    // Type new name in dialog input and save
    cy.get('mat-dialog-container').within(() => {
      cy.get('input').clear();
      cy.get('input').type('renamed.txt');
      cy.contains('button', 'Save').click();
    });

    cy.wait('@rename');
    cy.contains('mat-list-item div[matListItemTitle]', 'renamed.txt').should('exist');
  });

  it('initiates a download request', () => {
    const token = fakeJwt({ userId: 'u1', email: 'stub@e.com', exp: Math.floor(Date.now() / 1000) + 3600 });
    // Seed list with one file
    cy.intercept('GET', '**/api/files*', {
      statusCode: 200,
      body: [{ id: fileId, originalName: 'renamed.txt', size: 5, mimeType: 'text/plain', createdAt: new Date().toISOString(), status: 'COMPLETED' }],
    }).as('getFiles');

    cy.visit('/dashboard', {
      onBeforeLoad(win) {
        win.localStorage.setItem('auth_token', token);
      },
    });
    cy.wait('@getFiles');

    cy.intercept('GET', `**/api/files/${fileId}`, {
      statusCode: 200,
      headers: { 'content-type': 'application/zip' },
      body: 'ZIP',
    }).as('download');

    // Click the download button (cloud_download icon)
    cy.contains('button', 'cloud_download').click();

    // Assert network call made
    cy.wait('@download');
  });
});
