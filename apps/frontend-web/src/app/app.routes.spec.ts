import { appRoutes } from './app.routes';

describe('app.routes', () => {
  it('should load components via loadComponent', async () => {
    const loadFns = appRoutes
      .filter((r) => typeof (r as any).loadComponent === 'function')
      .map((r) => (r as any).loadComponent());

    const comps = await Promise.all(loadFns);
    expect(comps.length).toBeGreaterThanOrEqual(3);
    comps.forEach((cmp) => expect(cmp).toBeDefined());
  });

  it('should define redirects for empty and wildcard paths', () => {
    const empty = appRoutes.find((r) => r.path === '');
    const wildcard = appRoutes.find((r) => r.path === '**');
    expect(empty?.redirectTo).toBe('/login');
    expect(wildcard?.redirectTo).toBe('/dashboard');
  });
});
