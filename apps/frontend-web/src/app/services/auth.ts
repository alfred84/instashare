import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

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

  constructor() {
    // Rehydrate auth state from localStorage on service initialization
    const token = localStorage.getItem('auth_token');
    if (token) {
      // In a real app, you would decode the token to get user info and expiration
      // For simplicity, we'll just set the token and assume it's valid.
      // A dedicated method to fetch the current user profile would be better.
      this.authState.update((state) => ({ ...state, token }));
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
    localStorage.removeItem('auth_token');
    this.authState.set({ currentUser: null, token: null });
    this.router.navigate(['/login']);
  }

  private handleAuthSuccess(response: AuthResponse): void {
    localStorage.setItem('auth_token', response.accessToken);
    // Decode token to get user info (simplified for this example)
    // In a real app, use a library like jwt-decode
    const decodedUser: User = { id: 'temp-id', email: 'user@example.com' }; // Placeholder
    this.authState.set({ currentUser: decodedUser, token: response.accessToken });
    this.router.navigate(['/dashboard']);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Authentication Error:', error.message);
    // In a real app, you'd use a more sophisticated error handling strategy
    // and provide user-friendly error messages.
    throw new Error('An error occurred during authentication.');
  }
}
