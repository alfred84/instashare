import { TestBed } from '@angular/core/testing';

import { Auth } from './auth';

describe('Auth', () => {
  let service: Auth;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Auth);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

// Additional tests
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

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

  function fakeJwt(payload: Record<string, unknown>): string {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64');
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
    service = TestBed.inject(Auth);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()).toEqual({ id: 'u3', email: 'old@e.com' });
  });
});
