import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { Report, ReportCategory } from '@livin/common';
import { environment } from '../../environments/environment.local';

export interface CreateReportPayload {
  reportedId: string;
  category: ReportCategory;
  description: string;
  connectionId?: string;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/reports`;

  create(payload: CreateReportPayload): Observable<Report> {
    return this.http.post<Report>(this.baseUrl, payload, { withCredentials: true });
  }

  listAll(): Observable<Report[]> {
    return this.http.get<Report[]>(this.baseUrl, { withCredentials: true });
  }

  updateStatus(id: string, status: string): Observable<Report> {
    return this.http.patch<Report>(`${this.baseUrl}/${id}`, { status }, { withCredentials: true });
  }
}
