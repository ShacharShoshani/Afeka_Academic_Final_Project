import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import type { AppNotification } from '@livin/common';
import { environment } from '../../environments/environment.local';

export interface NotificationsResponse {
  notifications: AppNotification[];
  unreadCount: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/notifications`;

  // Live unread badge count — updated by socket events and API responses.
  readonly unreadCount = signal(0);

  fetchAll(): Observable<NotificationsResponse> {
    return this.http.get<NotificationsResponse>(this.baseUrl, { withCredentials: true }).pipe(
      tap((r) => this.unreadCount.set(r.unreadCount)),
    );
  }

  markRead(id: string): Observable<{ ok: boolean }> {
    return this.http.patch<{ ok: boolean }>(`${this.baseUrl}/${id}/read`, {}, { withCredentials: true });
  }

  markAllRead(): Observable<{ ok: boolean }> {
    return this.http
      .patch<{ ok: boolean }>(`${this.baseUrl}/read-all`, {}, { withCredentials: true })
      .pipe(tap(() => this.unreadCount.set(0)));
  }

  incrementUnread(): void {
    this.unreadCount.update((n) => n + 1);
  }
}
