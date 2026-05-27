import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { PublicUser } from '@livin/common';
import { environment } from '../../environments/environment.local';

@Injectable({ providedIn: 'root' })
export class SwipeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/swipe`;

  getDeck(): Observable<PublicUser[]> {
    return this.http.get<PublicUser[]>(`${this.baseUrl}/deck`, { withCredentials: true });
  }

  swipe(toUserId: string, liked: boolean): Observable<{ matched: boolean; connectionId?: string }> {
    return this.http.post<{ matched: boolean; connectionId?: string }>(
      this.baseUrl,
      { toUserId, liked },
      { withCredentials: true },
    );
  }
}
