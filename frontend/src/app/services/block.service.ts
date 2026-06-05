import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.local';

export interface BlockEntry { blockedId: string; createdAt: string; }

@Injectable({ providedIn: 'root' })
export class BlockService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/blocks`;

  list(): Observable<BlockEntry[]> {
    return this.http.get<BlockEntry[]>(this.baseUrl, { withCredentials: true });
  }

  block(blockedId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(this.baseUrl, { blockedId }, { withCredentials: true });
  }

  unblock(blockedId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${blockedId}`, { withCredentials: true });
  }
}
