import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { MatchPreference } from '@livin/common';
import { environment } from '../../environments/environment.local';

// Fields the user edits — everything except the server-managed identity/timestamps.
export type MatchPreferenceInput = Omit<
  MatchPreference,
  'id' | 'userId' | 'createdAt' | 'updatedAt'
>;

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/preferences`;

  get(): Observable<MatchPreference> {
    return this.http.get<MatchPreference>(this.baseUrl, { withCredentials: true });
  }

  update(input: MatchPreferenceInput): Observable<MatchPreference> {
    return this.http.put<MatchPreference>(this.baseUrl, input, { withCredentials: true });
  }
}
