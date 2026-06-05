import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import type { ConnectionJob, JobStatus, Review, UserConnection, PaymentRateType } from '@livin/common';
import { ConnectionsService } from '../../services/connections.service';
import { JobService, UpdateJobPayload } from '../../services/job.service';
import { ReviewService } from '../../services/review.service';
import { AuthService } from '../../services/auth.service';

const RATE_TYPE_LABELS: Record<PaymentRateType, string> = {
  hourly: 'Hourly',
  daily: 'Daily',
  weekly: 'Weekly',
};

const STATUS_LABELS: Record<JobStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

@Component({
  selector: 'app-confirmed-jobs',
  imports: [FormsModule],
  templateUrl: './confirmed-jobs.html',
  styleUrl: './confirmed-jobs.css',
})
export class ConfirmedJobs implements OnInit {
  private readonly router = inject(Router);
  private readonly connectionsService = inject(ConnectionsService);
  private readonly jobService = inject(JobService);
  private readonly reviewService = inject(ReviewService);
  private readonly authService = inject(AuthService);

  protected readonly jobs = signal<UserConnection[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly editingJobId = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly saveError = signal('');
  // Review state keyed by jobId
  protected readonly reviewingJobId = signal<string | null>(null);
  protected readonly reviewDraft = { rating: 5, comment: '' };
  protected readonly submittingReview = signal(false);
  protected readonly reviewError = signal('');
  // Tracks which jobs the user already reviewed, keyed by jobId
  protected readonly reviewedJobs = signal<Set<string>>(new Set());
  protected readonly STARS = [1, 2, 3, 4, 5];

  protected readonly RATE_TYPE_LABELS = RATE_TYPE_LABELS;
  protected readonly STATUS_LABELS = STATUS_LABELS;
  protected readonly rateTypes: PaymentRateType[] = ['hourly', 'daily', 'weekly'];
  protected readonly paymentMethods = ['Cash', 'Bank Transfer', 'PayPal', 'Bit', 'PayBox'];

  // Draft for the job detail edit form.
  protected draft: Partial<UpdateJobPayload> & { title: string; description: string } = {
    title: '', description: '', startDate: '', endDate: '',
    locationLat: 0, locationLng: 0,
    paymentMethod: undefined, paymentAmount: 0, paymentCurrency: 'ILS',
    paymentRateType: undefined, status: 'accepted',
  };

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.connectionsService.list('confirmed').subscribe({
      next: (list) => { this.jobs.set(list); this.loading.set(false); },
      error: () => { this.error.set('Failed to load confirmed jobs'); this.loading.set(false); },
    });
  }

  protected openChat(id: string): void {
    this.router.navigate(['/connections', id]);
  }

  protected startEditJob(conn: UserConnection): void {
    const j = conn.job;
    if (!j) return;
    this.draft = {
      title: j.title === 'Care Job' ? '' : j.title,
      description: j.description,
      startDate: j.startDate ? new Date(j.startDate).toISOString().substring(0, 10) : '',
      endDate: j.endDate ? new Date(j.endDate).toISOString().substring(0, 10) : '',
      locationLat: j.locationLat || 0,
      locationLng: j.locationLng || 0,
      paymentMethod: j.paymentMethod as import('@livin/common').PaymentMethod | undefined,
      paymentAmount: j.paymentAmount,
      paymentCurrency: j.paymentCurrency,
      paymentRateType: j.paymentRateType ?? undefined,
      status: j.status,
    };
    this.editingJobId.set(j.id);
    this.saveError.set('');
  }

  protected cancelEditJob(): void {
    this.editingJobId.set(null);
  }

  protected saveJobDetails(): void {
    const jobId = this.editingJobId();
    if (!jobId || this.saving()) return;
    this.saving.set(true);
    this.saveError.set('');

    const payload: UpdateJobPayload = {
      ...this.draft,
      title: this.draft.title?.trim() || 'Care Job',
    };

    this.jobService.update(jobId, payload).subscribe({
      next: (res) => {
        // Update the job inside the matching connection.
        this.jobs.update((list) =>
          list.map((c) => c.job?.id === jobId ? { ...c, job: { ...c.job!, ...res.job } } : c)
        );
        this.saving.set(false);
        this.editingJobId.set(null);
      },
      error: (err) => {
        this.saving.set(false);
        this.saveError.set(err?.error?.error || 'Failed to save job details');
      },
    });
  }

  protected markStatus(conn: UserConnection, status: string): void {
    const jobId = conn.job?.id;
    if (!jobId) return;
    this.jobService.update(jobId, { status }).subscribe({
      next: (res) => {
        this.jobs.update((list) =>
          list.map((c) => c.job?.id === jobId ? { ...c, job: { ...c.job!, status: res.job.status } } : c)
        );
      },
    });
  }

  protected isOwner(conn: UserConnection): boolean {
    return conn.job?.ownerId === this.authService.user()?.id;
  }

  protected startReview(conn: UserConnection): void {
    this.reviewDraft.rating = 5;
    this.reviewDraft.comment = '';
    this.reviewError.set('');
    this.reviewingJobId.set(conn.job!.id);
  }

  protected cancelReview(): void {
    this.reviewingJobId.set(null);
  }

  protected setReviewRating(r: number): void {
    this.reviewDraft.rating = r;
  }

  protected submitReview(conn: UserConnection): void {
    const jobId = conn.job?.id;
    const targetId = conn.otherUser?.id;
    if (!jobId || !targetId || this.submittingReview()) return;
    this.submittingReview.set(true);
    this.reviewError.set('');
    this.reviewService.create({
      jobId,
      targetId,
      rating: this.reviewDraft.rating,
      comment: this.reviewDraft.comment.trim(),
    }).subscribe({
      next: () => {
        this.submittingReview.set(false);
        this.reviewingJobId.set(null);
        this.reviewedJobs.update((s) => new Set([...s, jobId]));
      },
      error: (err) => {
        this.submittingReview.set(false);
        this.reviewError.set(err?.error?.error || 'Failed to submit review');
      },
    });
  }

  protected canReview(conn: UserConnection): boolean {
    const jobId = conn.job?.id;
    if (!jobId) return false;
    if (this.reviewedJobs().has(jobId)) return false;
    return conn.job?.status === 'completed';
  }

  protected formatDate(iso: string | null | undefined): string {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  }

  protected jobNeedsDetails(j: ConnectionJob | null): boolean {
    if (!j) return false;
    return j.title === 'Care Job' && !j.description && j.paymentAmount === 0;
  }
}
