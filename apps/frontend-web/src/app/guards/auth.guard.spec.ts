import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { authGuard } from './auth.guard';
import { Auth } from '../services/auth';

describe('authGuard', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        { provide: Auth, useValue: { isAuthenticated: jest.fn() } },
      ],
    });
    router = TestBed.inject(Router);
  });

  it('returns true when authenticated', () => {
    const auth = TestBed.inject(Auth) as unknown as { isAuthenticated: jest.Mock };
    auth.isAuthenticated.mockReturnValue(true);
    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    expect(result).toBe(true);
  });

  it('redirects to /login when not authenticated', () => {
    const auth = TestBed.inject(Auth) as unknown as { isAuthenticated: jest.Mock };
    auth.isAuthenticated.mockReturnValue(false);
    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    expect(result).toEqual(router.parseUrl('/login'));
    expect(result instanceof UrlTree).toBe(true);
  });
});
