import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { ConnectionMessage, UserConnection } from '@livin/common';
import { environment } from '../../environments/environment.local';

@Injectable({ providedIn: 'root' })
export class ConnectionsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/connections`;

  list(): Observable<UserConnection[]> {
    return this.http.get<UserConnection[]>(this.baseUrl, { withCredentials: true });
  }

  getById(id: string): Observable<UserConnection> {
    return this.http.get<UserConnection>(`${this.baseUrl}/${id}`, { withCredentials: true });
  }

  sendMessage(id: string, content: string): Observable<ConnectionMessage> {
    return this.http.post<ConnectionMessage>(
      `${this.baseUrl}/${id}/messages`,
      { content },
      { withCredentials: true },
    );
  }
}
