import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { Availability, CareType, Pet, Plant, PublicUser, StrayAnimal, UserRole } from '@livin/common';

export interface UserListFilters {
  role?: UserRole;
  careTypes?: CareType[];
  availability?: Availability[];
  residence?: string;
}
import { environment } from '../../environments/environment.local';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/users`;

  list(filters: UserListFilters = {}): Observable<PublicUser[]> {
    let params = new HttpParams();
    if (filters.role) params = params.set('role', filters.role);
    if (filters.careTypes?.length) params = params.set('careTypes', filters.careTypes.join(','));
    if (filters.availability?.length) params = params.set('availability', filters.availability.join(','));
    if (filters.residence?.trim()) params = params.set('residence', filters.residence.trim());
    return this.http.get<PublicUser[]>(this.baseUrl, { params, withCredentials: true });
  }

  getById(id: string): Observable<PublicUser> {
    return this.http.get<PublicUser>(`${this.baseUrl}/${id}`, { withCredentials: true });
  }

  getPets(id: string): Observable<Pet[]> {
    return this.http.get<Pet[]>(`${this.baseUrl}/${id}/pets`, { withCredentials: true });
  }

  getPlants(id: string): Observable<Plant[]> {
    return this.http.get<Plant[]>(`${this.baseUrl}/${id}/plants`, { withCredentials: true });
  }

  getStrays(id: string): Observable<StrayAnimal[]> {
    return this.http.get<StrayAnimal[]>(`${this.baseUrl}/${id}/strays`, { withCredentials: true });
  }
}
