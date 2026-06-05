import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { Report, ReportStatus } from '@livin/common';
import { ReportService } from '../../services/report.service';

const STATUS_OPTIONS: ReportStatus[] = ['open', 'under_review', 'resolved', 'dismissed'];
const STATUS_LABELS: Record<ReportStatus, string> = {
  open: 'Open', under_review: 'Under Review', resolved: 'Resolved', dismissed: 'Dismissed',
};

@Component({
  selector: 'app-admin-reports',
  imports: [],
  templateUrl: './admin-reports.html',
  styleUrl: './admin-reports.css',
})
export class AdminReports implements OnInit {
  private readonly reportService = inject(ReportService);
  private readonly router = inject(Router);

  protected readonly reports = signal<Report[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly STATUS_OPTIONS = STATUS_OPTIONS;
  protected readonly STATUS_LABELS = STATUS_LABELS;

  ngOnInit(): void {
    this.reportService.listAll().subscribe({
      next: (list) => { this.reports.set(list); this.loading.set(false); },
      error: (err) => {
        this.error.set(err?.status === 403 ? 'Admin access required.' : 'Failed to load reports.');
        this.loading.set(false);
      },
    });
  }

  protected updateStatus(report: Report, status: ReportStatus): void {
    this.reportService.updateStatus(report.id, status).subscribe({
      next: (updated) => {
        this.reports.update((list) => list.map((r) => r.id === updated.id ? updated : r));
      },
    });
  }

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  }

  protected goBack(): void { this.router.navigate(['/settings']); }
}
