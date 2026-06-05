import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.local';

@Injectable({ providedIn: 'root' })
export class AuthExtService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/auth`;

  forgotPassword(email: string): Observable<{ message: string; token?: string; note?: string }> {
    return this.http.post<{ message: string; token?: string; note?: string }>(
      `${this.base}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.base}/reset-password`, { token, newPassword });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.base}/change-password`, { currentPassword, newPassword }, { withCredentials: true });
  }
}
