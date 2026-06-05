import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import type { PaymentRateType, ServiceType } from '@livin/common';
import { AuthService } from '../../services/auth.service';
import {
  SwipeService,
  type CaretakerCandidate,
  type SwipeJob,
} from '../../services/swipe.service';

@Component({
  selector: 'app-swipe-deck',
  imports: [],
  templateUrl: './swipe-deck.html',
  styleUrl: './swipe-deck.css',
})
export class SwipeDeck implements OnInit {
  private readonly swipeService = inject(SwipeService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // ── Role ──────────────────────────────────────────────────────────────────
  protected readonly isOwner = computed(() => this.authService.user()?.role === 'owner');

  // ── Shared ────────────────────────────────────────────────────────────────
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly matched = signal<{ connectionId: string; name: string; photo: string } | null>(null);

  // ── Caretaker deck (job cards) ────────────────────────────────────────────
  protected readonly jobs = signal<SwipeJob[]>([]);
  protected readonly currentIndex = signal(0);
  protected readonly dragging = signal(false);
  protected readonly dragDeltaX = signal(0);
  protected readonly flipped = signal(false);
  protected readonly empty = signal(false);

  private startX = 0;
  private pointerId = -1;

  protected readonly currentJob = computed(() => this.jobs()[this.currentIndex()] ?? null);
  protected readonly nextJob = computed(() => this.jobs()[this.currentIndex() + 1] ?? null);
  protected readonly likeOpacity = computed(() => Math.min(1, Math.max(0, this.dragDeltaX() / 100)));
  protected readonly passOpacity = computed(() => Math.min(1, Math.max(0, -this.dragDeltaX() / 100)));
  protected readonly cardTransform = computed(() => {
    const dx = this.dragDeltaX();
    if (!this.dragging() || dx === 0) return '';
    return `translateX(${dx}px) rotate(${dx * 0.08}deg)`;
  });

  // ── Owner deck (caretaker profiles for a selected job) ────────────────────
  protected readonly ownerPhase = signal<'loading' | 'no-jobs' | 'choose-job' | 'swiping'>('loading');
  protected readonly chooserJobs = signal<Array<{ id: string; title: string }>>([]);
  protected readonly activeJobId = signal<string | null>(null);
  protected readonly activeJob = signal<SwipeJob | null>(null);
  protected readonly caretakers = signal<CaretakerCandidate[]>([]);
  protected readonly caretakerIndex = signal(0);
  protected readonly caretakerFlipped = signal(false);

  protected readonly currentCaretaker = computed(() => this.caretakers()[this.caretakerIndex()] ?? null);
  protected readonly nextCaretaker = computed(() => this.caretakers()[this.caretakerIndex() + 1] ?? null);
  protected readonly caretakerEmpty = computed(() =>
    !this.currentCaretaker() && this.ownerPhase() === 'swiping',
  );

  ngOnInit(): void {
    const qJobId = this.route.snapshot.queryParamMap.get('jobId') ?? undefined;
    this.loadDeck(qJobId);
  }

  private loadDeck(jobId?: string): void {
    this.loading.set(true);
    this.swipeService.getDeck(jobId).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.type === 'jobs') {
          if (res.jobs.length === 0) this.empty.set(true);
          else this.jobs.set(res.jobs);
        } else if (res.type === 'caretakers') {
          this.activeJobId.set(res.jobId);
          this.activeJob.set(res.job);
          this.caretakers.set(res.caretakers);
          this.caretakerIndex.set(0);
          this.ownerPhase.set('swiping');
        } else if (res.type === 'choose-job') {
          this.chooserJobs.set(res.jobs);
          this.ownerPhase.set('choose-job');
        } else if (res.type === 'no-jobs') {
          this.ownerPhase.set('no-jobs');
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Failed to load deck');
      },
    });
  }

  protected selectJob(jobId: string): void {
    this.ownerPhase.set('loading');
    this.loadDeck(jobId);
  }

  // ── Caretaker gestures ────────────────────────────────────────────────────

  protected onPointerDown(e: PointerEvent): void {
    if (this.pointerId !== -1 || this.flipped()) return;
    this.pointerId = e.pointerId;
    this.startX = e.clientX;
    this.dragging.set(true);
    this.dragDeltaX.set(0);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  protected onPointerMove(e: PointerEvent): void {
    if (e.pointerId !== this.pointerId) return;
    this.dragDeltaX.set(e.clientX - this.startX);
  }

  protected onPointerUp(e: PointerEvent): void {
    if (e.pointerId !== this.pointerId) return;
    this.pointerId = -1;
    const delta = this.dragDeltaX();
    this.dragging.set(false);
    this.dragDeltaX.set(0);
    if (Math.abs(delta) >= 100) this.commitJobSwipe(delta > 0);
  }

  protected swipeJobLeft(): void { this.commitJobSwipe(false); }
  protected swipeJobRight(): void { this.commitJobSwipe(true); }

  private commitJobSwipe(liked: boolean): void {
    const job = this.currentJob();
    if (!job) return;
    this.flipped.set(false);
    this.currentIndex.update((i) => i + 1);
    if (this.currentIndex() >= this.jobs().length) {
      this.empty.set(true);
    } else if (this.jobs().length - this.currentIndex() < 3) {
      this.fetchMoreJobs();
    }
    this.swipeService.express(job.id, liked).subscribe({
      next: (res) => {
        if (res.matched && res.connectionId) {
          this.matched.set({
            connectionId: res.connectionId,
            name: job.owner?.name ?? '',
            photo: job.owner?.profilePhoto ?? '',
          });
        }
      },
    });
  }

  private fetchMoreJobs(): void {
    this.swipeService.getDeck().subscribe({
      next: (res) => {
        if (res.type === 'jobs' && res.jobs.length > 0) {
          this.jobs.update((existing) => {
            const ids = new Set(existing.map((j) => j.id));
            return [...existing, ...res.jobs.filter((j) => !ids.has(j.id))];
          });
          this.empty.set(false);
        }
      },
    });
  }

  protected toggleFlip(e: Event): void {
    e.stopPropagation();
    this.flipped.update((v) => !v);
  }

  // ── Owner swipe gestures (caretaker cards) ────────────────────────────────

  protected swipeCaretakerLeft(): void { this.commitCaretakerSwipe(false); }
  protected swipeCaretakerRight(): void { this.commitCaretakerSwipe(true); }

  private commitCaretakerSwipe(liked: boolean): void {
    const caretaker = this.currentCaretaker();
    const jobId = this.activeJobId();
    if (!caretaker || !jobId) return;
    this.caretakerFlipped.set(false);
    this.caretakerIndex.update((i) => i + 1);
    this.swipeService.express(jobId, liked, caretaker.id).subscribe({
      next: (res) => {
        if (res.matched && res.connectionId) {
          this.matched.set({
            connectionId: res.connectionId,
            name: caretaker.name,
            photo: caretaker.profilePhoto,
          });
        }
      },
    });
  }

  protected toggleCaretakerFlip(e: Event): void {
    e.stopPropagation();
    this.caretakerFlipped.update((v) => !v);
  }

  // ── Match modal ────────────────────────────────────────────────────────────

  protected dismissMatch(): void { this.matched.set(null); }
  protected openChat(): void {
    const m = this.matched();
    if (m) { this.matched.set(null); this.router.navigate(['/connections', m.connectionId]); }
  }

  // ── Formatting ─────────────────────────────────────────────────────────────

  protected formatService(s: ServiceType): string {
    return s.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  protected formatRateType(r: PaymentRateType | null): string {
    if (!r) return '';
    return '/' + r.charAt(0).toUpperCase() + r.slice(1);
  }

  protected mainImage(job: SwipeJob): string | null {
    if (job.pets?.length > 0 && job.pets[0].image) return job.pets[0].image;
    if (job.plants?.length > 0 && job.plants[0].image) return job.plants[0].image;
    if (job.strayAnimals?.length > 0 && job.strayAnimals[0].image) return job.strayAnimals[0].image;
    return null;
  }

  protected careItemName(job: SwipeJob): string {
    if (job.pets?.length > 0) return job.pets[0].name;
    if (job.plants?.length > 0) return job.plants[0].name;
    if (job.strayAnimals?.length > 0) return job.strayAnimals[0].name ?? 'Stray';
    return '';
  }

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short' });
  }

  protected distanceLabel(lat?: number | null, lng?: number | null): string | null {
    const user = this.authService.user() as any;
    if (!user?.lat || lat == null || lng == null) return null;
    const R = 6371;
    const dLat = ((lat - user.lat) * Math.PI) / 180;
    const dLng = ((lng - user.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(user.lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
    const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return km < 1 ? '<1 km away' : `${Math.round(km)} km away`;
  }

  protected paymentSummary(job: SwipeJob): string {
    if (job.minPayment != null && job.maxPayment != null) {
      return `${job.currency} ${job.minPayment}-${job.maxPayment}${this.formatRateType(job.paymentRateType)}`;
    }
    if (job.paymentAmount > 0) {
      return `${job.currency || job.paymentCurrency} ${job.paymentAmount}${this.formatRateType(job.paymentRateType)}`;
    }
    return 'Volunteer';
  }

  protected navigateCreateJob(): void {
    this.router.navigate(['/swipe/create-job']);
  }

  protected navigateMyJobs(): void {
    this.router.navigate(['/my-jobs']);
  }
}
