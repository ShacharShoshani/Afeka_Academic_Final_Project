import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { ConnectionMessage, ConnectionStatus, UserConnection } from '@livin/common';
import { environment } from '../../environments/environment.local';

@Injectable({ providedIn: 'root' })
export class ConnectionsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/connections`;

  list(status?: ConnectionStatus): Observable<UserConnection[]> {
    const params = status ? { params: { status } } : {};
    return this.http.get<UserConnection[]>(this.baseUrl, { withCredentials: true, ...params });
  }

  getById(id: string): Observable<UserConnection> {
    return this.http.get<UserConnection>(`${this.baseUrl}/${id}`, { withCredentials: true });
  }

  sendMessage(id: string, content: string, imageData?: string | null): Observable<ConnectionMessage> {
    return this.http.post<ConnectionMessage>(
      `${this.baseUrl}/${id}/messages`,
      { content, imageData: imageData ?? null },
      { withCredentials: true },
    );
  }

  confirm(id: string): Observable<UserConnection> {
    return this.http.post<UserConnection>(
      `${this.baseUrl}/${id}/confirm`,
      {},
      { withCredentials: true },
    );
  }

  decline(id: string): Observable<UserConnection> {
    return this.http.post<UserConnection>(
      `${this.baseUrl}/${id}/decline`,
      {},
      { withCredentials: true },
    );
  }
}
