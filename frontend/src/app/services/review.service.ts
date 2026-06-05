import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { Review } from '@livin/common';
import { environment } from '../../environments/environment.local';

export interface CreateReviewPayload {
  jobId: string;
  targetId: string;
  rating: number;
  comment?: string;
}

export interface JobReviewsResponse {
  reviews: Review[];
  myReview: Review | null;
}

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/reviews`;

  create(payload: CreateReviewPayload): Observable<Review> {
    return this.http.post<Review>(this.baseUrl, payload, { withCredentials: true });
  }

  forUser(userId: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.baseUrl}/user/${userId}`, { withCredentials: true });
  }

  forJob(jobId: string): Observable<JobReviewsResponse> {
    return this.http.get<JobReviewsResponse>(`${this.baseUrl}/job/${jobId}`, { withCredentials: true });
  }
}
