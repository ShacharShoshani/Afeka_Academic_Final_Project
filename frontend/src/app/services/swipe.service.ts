import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { Job, JobInterest, PublicUser } from '@livin/common';
import { environment } from '../../environments/environment.local';

// Caretaker's view of a job card (includes owner + care items).
export type SwipeJob = Job & {
  owner: NonNullable<Job['owner']>;
  pendingCount?: number;
  matchedCount?: number;
};

// A caretaker entry in the owner's deck (includes alreadyInterested flag).
export type CaretakerCandidate = PublicUser & { alreadyInterested?: boolean };

// Deck response shapes.
export interface CaretakerDeckResponse {
  type: 'jobs';
  jobs: SwipeJob[];
}

export interface OwnerCaretakerDeckResponse {
  type: 'caretakers';
  jobId: string;
  job: SwipeJob;
  caretakers: CaretakerCandidate[];
}

export interface OwnerChooseJobResponse {
  type: 'choose-job';
  jobs: Array<{ id: string; title: string }>;
}

export interface NoJobsResponse {
  type: 'no-jobs';
}

export type DeckResponse =
  | CaretakerDeckResponse
  | OwnerCaretakerDeckResponse
  | OwnerChooseJobResponse
  | NoJobsResponse;

@Injectable({ providedIn: 'root' })
export class SwipeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/swipe`;

  /** Load the swipe deck. Pass jobId when owner has selected a specific job. */
  getDeck(jobId?: string): Observable<DeckResponse> {
    const params = jobId ? { params: { jobId } } : {};
    return this.http.get<DeckResponse>(`${this.baseUrl}/deck`, { withCredentials: true, ...params });
  }

  /** Owner's own swipe jobs with pending/matched counts. */
  getMyJobs(): Observable<SwipeJob[]> {
    return this.http.get<SwipeJob[]>(`${this.baseUrl}/my-jobs`, { withCredentials: true });
  }

  /**
   * Express interest (or pass) for a job/caretaker pair.
   * Caretaker: pass jobId only (caretakerId is ignored).
   * Owner: pass jobId + caretakerId.
   */
  express(
    jobId: string,
    liked: boolean,
    caretakerId?: string,
  ): Observable<{ matched: boolean; connectionId?: string }> {
    return this.http.post<{ matched: boolean; connectionId?: string }>(
      `${this.baseUrl}/express`,
      { jobId, liked, caretakerId },
      { withCredentials: true },
    );
  }

  /** Owner sees all interests for a specific job. */
  getApplicants(jobId: string): Observable<JobInterest[]> {
    return this.http.get<JobInterest[]>(
      `${this.baseUrl}/job-applicants/${jobId}`,
      { withCredentials: true },
    );
  }
}
