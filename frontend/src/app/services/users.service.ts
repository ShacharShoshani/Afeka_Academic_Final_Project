import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { PublicUser, UserRole } from '@livin/common';
import { environment } from '../../environments/environment.local';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/users`;

  list(role?: UserRole): Observable<PublicUser[]> {
    let params = new HttpParams();
    if (role) params = params.set('role', role);
    return this.http.get<PublicUser[]>(this.baseUrl, { params, withCredentials: true });
  }
}
