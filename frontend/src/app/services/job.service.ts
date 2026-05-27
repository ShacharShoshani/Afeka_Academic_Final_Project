import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { Job, PaymentMethod, PaymentRateType, PublicUser } from '@livin/common';
import { environment } from '../../environments/environment.local';

// The API includes the hydrated `owner` relation on every Job response
export type JobWithOwner = Job & { owner?: Pick<PublicUser, 'id' | 'name'> };

export interface CreateJobPayload {
  title: string;
  description: string;
  startDate?: string;
  endDate?: string;
  locationLat?: number;
  locationLng?: number;
  paymentMethod?: PaymentMethod;
  paymentRateType?: PaymentRateType;
  paymentAmount?: number;
  paymentCurrency?: string;
  petIds?: string[];
  plantIds?: string[];
  strayAnimalIds?: string[];
}

export interface UpdateJobPayload {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  locationLat?: number;
  locationLng?: number;
  paymentMethod?: PaymentMethod;
  paymentRateType?: PaymentRateType;
  paymentAmount?: number;
  paymentCurrency?: string;
  status?: string;
  petIds?: string[];
  plantIds?: string[];
  strayAnimalIds?: string[];
}

@Injectable({ providedIn: 'root' })
export class JobService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/jobs`;

  list(): Observable<JobWithOwner[]> {
    return this.http.get<JobWithOwner[]>(this.baseUrl, { withCredentials: true });
  }

  create(payload: CreateJobPayload): Observable<{ message: string; job: JobWithOwner }> {
    return this.http.post<{ message: string; job: JobWithOwner }>(this.baseUrl, payload, {
      withCredentials: true,
    });
  }

  update(id: string, payload: UpdateJobPayload): Observable<{ message: string; job: JobWithOwner }> {
    return this.http.put<{ message: string; job: JobWithOwner }>(`${this.baseUrl}/${id}`, payload, {
      withCredentials: true,
    });
  }

  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`, {
      withCredentials: true,
    });
  }
}
