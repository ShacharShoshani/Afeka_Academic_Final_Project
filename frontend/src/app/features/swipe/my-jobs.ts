import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import type { UserConnection } from '@livin/common';
import { AuthService } from '../../services/auth.service';
import { SwipeService, type SwipeJob } from '../../services/swipe.service';
import { ConnectionsService } from '../../services/connections.service';

@Component({
  selector: 'app-my-jobs',
  imports: [],
  templateUrl: './my-jobs.html',
  styleUrl: './my-jobs.css',
})
export class MyJobs implements OnInit {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly swipeService = inject(SwipeService);
  private readonly connectionsService = inject(ConnectionsService);

  protected readonly isOwner = computed(() => this.auth.user()?.role === 'owner');

  // Owner: swipe jobs
  protected readonly myJobs = signal<SwipeJob[]>([]);
  protected readonly loadingJobs = signal(true);

  // Both: confirmed jobs (connections with confirmedAt)
  protected readonly confirmedConnections = signal<UserConnection[]>([]);
  protected readonly loadingConfirmed = signal(true);

  protected readonly error = signal('');

  ngOnInit(): void {
    if (this.isOwner()) {
      this.swipeService.getMyJobs().subscribe({
        next: (jobs) => { this.myJobs.set(jobs); this.loadingJobs.set(false); },
        error: () => this.loadingJobs.set(false),
      });
    } else {
      this.loadingJobs.set(false);
    }

    this.connectionsService.list('confirmed').subscribe({
      next: (list) => { this.confirmedConnections.set(list); this.loadingConfirmed.set(false); },
      error: () => this.loadingConfirmed.set(false),
    });
  }

  protected createJob(): void {
    this.router.navigate(['/swipe/create-job']);
  }

  protected openSearch(jobId: string): void {
    this.router.navigate(['/swipe'], { queryParams: { jobId } });
  }

  protected openChat(connectionId: string): void {
    this.router.navigate(['/connections', connectionId]);
  }

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  }

  protected statusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: 'Open', accepted: 'Matched', in_progress: 'In Progress',
      completed: 'Completed', cancelled: 'Cancelled',
    };
    return map[status] ?? status;
  }

  protected mainImage(job: SwipeJob): string | null {
    if (job.pets?.length > 0 && job.pets[0].image) return job.pets[0].image;
    if (job.plants?.length > 0 && job.plants[0].image) return job.plants[0].image;
    if (job.strayAnimals?.length > 0 && job.strayAnimals[0].image) return job.strayAnimals[0].image;
    return null;
  }
}
