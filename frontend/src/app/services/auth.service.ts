import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import type { DisplayMode, User } from '@livin/common';
import { environment } from '../../environments/environment.local';

type SafeUser = Omit<User, 'password'> & { createdAt: string; updatedAt: string };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/auth`;

  private currentUser = signal<SafeUser | null>(null);

  readonly user = this.currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUser() !== null);

  register(data: Omit<User, 'id'>): Observable<SafeUser> {
    return this.http
      .post<SafeUser>(`${this.baseUrl}/register`, data, { withCredentials: true })
      .pipe(tap(user => this.currentUser.set(user)));
  }

  login(email: string, password: string): Observable<SafeUser> {
    return this.http
      .post<SafeUser>(`${this.baseUrl}/login`, { email, password }, { withCredentials: true })
      .pipe(tap(user => this.currentUser.set(user)));
  }

  me(): Observable<SafeUser> {
    return this.http
      .get<SafeUser>(`${this.baseUrl}/me`, { withCredentials: true })
      .pipe(tap(user => this.currentUser.set(user)));
  }

  logout(): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(`${this.baseUrl}/logout`, {}, { withCredentials: true })
      .pipe(tap(() => this.currentUser.set(null)));
  }

  updateDisplayMode(mode: DisplayMode): Observable<SafeUser> {
    return this.http
      .patch<SafeUser>(`${environment.apiUrl}/users/me`, { displayMode: mode }, { withCredentials: true })
      .pipe(tap(user => this.currentUser.set(user)));
  }

  updateProfile(data: Partial<SafeUser>): Observable<SafeUser> {
    return this.http
      .patch<SafeUser>(`${environment.apiUrl}/users/me`, data, { withCredentials: true })
      .pipe(tap(user => this.currentUser.set(user)));
  }
}
