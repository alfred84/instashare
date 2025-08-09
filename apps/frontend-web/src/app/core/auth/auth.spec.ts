import { TestBed } from '@angular/core/testing';

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { Auth } from './auth.service';

describe('Auth', () => {
  let service: Auth;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [Auth],
    });
    service = TestBed.inject(Auth);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

// Additional tests

describe('Auth - behaviors', () => {
  let service: Auth;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [Auth],
    });

    service = TestBed.inject(Auth);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    jest.restoreAllMocks();
  });

  function toBase64(value: string): string {
    // Use btoa with Unicode-safe encoding; jsdom provides btoa in tests
    const encoder = (str: string) =>
      (globalThis as Window & typeof globalThis).btoa(
        unescape(encodeURIComponent(str))
      );
    return encoder(value);
  }

  function fakeJwt(payload: Record<string, unknown>): string {
    const header = toBase64(JSON.stringify({ alg: 'none', typ: 'JWT' }));
    const body = toBase64(JSON.stringify(payload));
    return `${header}.${body}.`; // signature not verified by jwt-decode
  }

  it('login() should store token, update state and navigate to /dashboard', () => {
    const resp = { accessToken: fakeJwt({ userId: 'u1', email: 't@e.com', exp: Math.floor(Date.now() / 1000) + 3600 }) };

    service.login({ email: 't@e.com', password: 'pass' }).subscribe();

    const req = httpMock.expectOne('http://localhost:3333/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(resp);

    expect(localStorage.getItem('auth_token')).toBe(resp.accessToken);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()).toEqual({ id: 'u1', email: 't@e.com' });
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('register() should store token and navigate to /dashboard', () => {
    const resp = { accessToken: fakeJwt({ userId: 'u2', email: 'new@e.com', exp: Math.floor(Date.now() / 1000) + 3600 }) };

    service.register({ email: 'new@e.com', password: 'password123' }).subscribe();
    const req = httpMock.expectOne('http://localhost:3333/api/auth/register');
    expect(req.request.method).toBe('POST');
    req.flush(resp);

    expect(localStorage.getItem('auth_token')).toBe(resp.accessToken);
    expect(service.currentUser()).toEqual({ id: 'u2', email: 'new@e.com' });
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('constructor should load valid token from localStorage', () => {
    const token = fakeJwt({ userId: 'u3', email: 'old@e.com', exp: Math.floor(Date.now() / 1000) + 3600 });
    localStorage.setItem('auth_token', token);

    // Recreate service to trigger constructor logic
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [Auth],
    });
    service = TestBed.inject(Auth);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()).toEqual({ id: 'u3', email: 'old@e.com' });
  });

  it('logout() should clear state and navigate to /login', () => {
    const tok = fakeJwt({ userId: 'u4', email: 'x@y.com', exp: Math.floor(Date.now() / 1000) + 3600 });
    localStorage.setItem('auth_token', tok);
    // recreate to load state
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [Auth],
    });
    service = TestBed.inject(Auth);
    // Re-inject Router so the spy is attached to the fresh instance used by the service
    router = TestBed.inject(Router);
    expect(service.isAuthenticated()).toBe(true);

    const navSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    service.logout();
    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(navSpy).toHaveBeenCalledWith(['/login']);
  });

  it('constructor should remove invalid token from localStorage', () => {
    localStorage.setItem('auth_token', 'not-a-jwt');
    // recreate
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [Auth],
    });
    service = TestBed.inject(Auth);
    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  it('constructor should remove expired token from localStorage', () => {
    const expired = fakeJwt({ userId: 'u5', email: 'z@z.com', exp: Math.floor(Date.now() / 1000) - 10 });
    localStorage.setItem('auth_token', expired);
    // recreate
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [Auth],
    });
    service = TestBed.inject(Auth);
    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  it('login() should propagate error and not set token', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    service.login({ email: 'bad@e.com', password: 'nope' }).subscribe({
      next: () => expect(true).toBe(false),
      error: (err) => {
        expect(err).toBeTruthy();
      },
    });
    const req = httpMock.expectOne('http://localhost:3333/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Invalid' }, { status: 401, statusText: 'Unauthorized' });
    expect(localStorage.getItem('auth_token')).toBeNull();
    consoleSpy.mockRestore();
  });
});
