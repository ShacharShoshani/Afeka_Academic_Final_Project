import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { Pet, Plant } from '@livin/common';
import { environment } from '../../environments/environment.local';

// Payloads accepted by POST /api/pets and /api/plants (server fills owner/timestamps).
export type CreatePetInput = Partial<Omit<Pet, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>> & {
  type: string;
};
export type CreatePlantInput = Partial<Omit<Plant, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>>;

@Injectable({ providedIn: 'root' })
export class CareItemsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  createPet(data: CreatePetInput): Observable<Pet> {
    return this.http.post<Pet>(`${this.apiUrl}/pets`, data, { withCredentials: true });
  }

  createPlant(data: CreatePlantInput): Observable<Plant> {
    return this.http.post<Plant>(`${this.apiUrl}/plants`, data, { withCredentials: true });
  }
}
