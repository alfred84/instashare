import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';

// Interfaces
export interface User {
  id: string;
  email: string;
}

export interface AuthResponse {
  accessToken: string;
}

export interface AuthState {
  currentUser: User | null;
  token: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly apiUrl = 'http://localhost:3333/api/auth';

  // State management with signals
  private authState = signal<AuthState>({
    currentUser: null,
    token: null,
  });

  // Public signals for components to consume
  public currentUser = computed(() => this.authState().currentUser);
  public token = computed(() => this.authState().token);
  public isAuthenticated = computed(() => !!this.authState().token);

  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  constructor() {
    if (this.isBrowser) {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const decodedToken: { userId: string; email: string; exp: number } = jwtDecode(token);
          if (decodedToken.exp * 1000 > Date.now()) {
            const user: User = {
              id: decodedToken.userId,
              email: decodedToken.email,
            };
            this.authState.set({ currentUser: user, token: token });
          } else {
            localStorage.removeItem('auth_token');
          }
        } catch (error) {
          localStorage.removeItem('auth_token');
          console.error('Invalid token in localStorage', error);
        }
      }
    }
  }

  register(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, credentials).pipe(
      tap((response) => this.handleAuthSuccess(response)),
      catchError(this.handleError)
    );
  }

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => this.handleAuthSuccess(response)),
      catchError(this.handleError)
    );
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('auth_token');
    }
    this.authState.set({ currentUser: null, token: null });
    // Router navigation is fine on browser; on server it's a no-op during render
    if (this.isBrowser) {
      this.router.navigate(['/login']);
    }
  }

  private handleAuthSuccess(response: AuthResponse): void {
    if (this.isBrowser) {
      localStorage.setItem('auth_token', response.accessToken);
    }
    const decodedToken: { userId: string; email: string } = jwtDecode(response.accessToken);
    const user: User = {
      id: decodedToken.userId,
      email: decodedToken.email,
    };
    this.authState.set({ currentUser: user, token: response.accessToken });
    if (this.isBrowser) {
      this.router.navigate(['/dashboard']);
    }
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Authentication Error:', error.message);
    // In a real app, you'd use a more sophisticated error handling strategy
    // and provide user-friendly error messages.
    throw new Error('An error occurred during authentication.');
  }
}
