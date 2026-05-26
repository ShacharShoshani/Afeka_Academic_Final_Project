import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GoogleMap, MapMarker } from '@angular/google-maps';
import type { JobStatus } from '@livin/common';
import { AuthService } from '../../services/auth.service';
import { JobService, JobWithOwner } from '../../services/job.service';
import { formatDate } from '../../shared/utils/format';

type StatusFilter = 'all' | JobStatus;

interface JobDraft {
  id: string | null;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  paymentMethod: string;
  paymentAmount: number | null;
  paymentCurrency: string;
  locationLat: number | null;
  locationLng: number | null;
  locationAddress: string;
}

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Open' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const DEFAULT_CENTER: google.maps.LatLngLiteral = { lat: 32.0853, lng: 34.7818 };

@Component({
  selector: 'app-jobs',
  imports: [RouterLink, FormsModule, GoogleMap, MapMarker],
  templateUrl: './jobs.html',
  styleUrl: './jobs.css',
})
export class Jobs implements OnInit {
  /** Template ref for the Places Autocomplete input inside the form sheet. */
  @ViewChild('locationInput') locationInputRef?: ElementRef<HTMLInputElement>;

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly jobService = inject(JobService);
  private readonly cdr = inject(ChangeDetectorRef);

  private autocomplete?: google.maps.places.Autocomplete;

  // ── Signals ─────────────────────────────────────────────────────────────────

  protected readonly statusFilters = STATUS_FILTERS;
  protected readonly allJobs = signal<JobWithOwner[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly formOpen = signal(false);

  /** ID of the job card / map marker the user has tapped to highlight. */
  protected readonly selectedJobId = signal<string | null>(null);

  /** Center of the mini-map inside the create/edit form. */
  protected readonly formMapCenter = signal<google.maps.LatLngLiteral>(DEFAULT_CENTER);

  /** True once the user has selected a place via autocomplete (or the job already had coords). */
  protected readonly hasFormLocation = signal(false);

  // ── Computed ─────────────────────────────────────────────────────────────────

  protected readonly user = this.authService.user;
  protected readonly isOwner = computed(() => this.user()?.role === 'owner');

  protected readonly filteredJobs = computed(() => {
    const filter = this.statusFilter();
    const jobs = this.allJobs();
    return filter === 'all' ? jobs : jobs.filter((j) => j.status === filter);
  });

  /** Only the jobs that carry valid coordinates — used to render map markers. */
  protected readonly jobsWithLocation = computed(() =>
    this.filteredJobs().filter((j) => this.hasLocation(j)),
  );

  /** Map centre: selected job → first located job → Tel Aviv default. */
  protected readonly mapCenter = computed<google.maps.LatLngLiteral>(() => {
    const selId = this.selectedJobId();
    if (selId) {
      const sel = this.filteredJobs().find((j) => j.id === selId);
      if (sel && this.hasLocation(sel)) {
        return { lat: sel.locationLat!, lng: sel.locationLng! };
      }
    }
    const first = this.jobsWithLocation()[0];
    return first ? { lat: first.locationLat!, lng: first.locationLng! } : DEFAULT_CENTER;
  });

  /** Zoom in slightly when a specific job is selected. */
  protected readonly mapZoom = computed(() => (this.selectedJobId() ? 14 : 12));

  // ── Map options ──────────────────────────────────────────────────────────────

  protected readonly mapOptions: google.maps.MapOptions = {
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
  };

  protected readonly formMapOptions: google.maps.MapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    clickableIcons: false,
  };

  // ── Form state ───────────────────────────────────────────────────────────────

  protected draft: JobDraft = this.emptyDraft();
  protected readonly formatDate = formatDate;

  // ── Marker helpers ───────────────────────────────────────────────────────────

  protected hasLocation(job: JobWithOwner): boolean {
    return !!(job.locationLat && job.locationLng);
  }

  protected markerPosition(job: JobWithOwner): google.maps.LatLngLiteral {
    return { lat: job.locationLat!, lng: job.locationLng! };
  }

  protected markerOptions(job: JobWithOwner): google.maps.MarkerOptions {
    const selected = job.id === this.selectedJobId();
    return {
      title: job.title,
      // Red marker for the selected job, teal for the rest
      icon: selected
        ? 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
        : 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
      zIndex: selected ? 10 : 1,
    };
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.load();
  }

  // ── Actions ──────────────────────────────────────────────────────────────────

  protected setStatusFilter(value: StatusFilter): void {
    this.statusFilter.set(value);
  }

  /** Toggle selection: clicking the same card/marker deselects it. */
  protected selectJob(job: JobWithOwner): void {
    this.selectedJobId.update((curr) => (curr === job.id ? null : job.id));
  }

  protected goHome(): void {
    this.router.navigate(['/home']);
  }

  protected openAdd(): void {
    this.draft = this.emptyDraft();
    this.hasFormLocation.set(false);
    this.formMapCenter.set(DEFAULT_CENTER);
    this.formOpen.set(true);
    // Wait one tick for the @if block to render before attaching autocomplete
    setTimeout(() => this.initAutocomplete(), 0);
  }

  protected openEdit(job: JobWithOwner): void {
    this.draft = {
      id: job.id,
      title: job.title,
      description: job.description,
      startDate: job.startDate ? job.startDate.slice(0, 10) : '',
      endDate: job.endDate ? job.endDate.slice(0, 10) : '',
      paymentMethod: job.paymentMethod,
      paymentAmount: job.paymentAmount,
      paymentCurrency: job.paymentCurrency,
      locationLat: job.locationLat ?? null,
      locationLng: job.locationLng ?? null,
      locationAddress: '',
    };
    const hasLoc = this.hasLocation(job);
    this.hasFormLocation.set(hasLoc);
    this.formMapCenter.set(
      hasLoc ? { lat: job.locationLat!, lng: job.locationLng! } : DEFAULT_CENTER,
    );
    this.formOpen.set(true);
    setTimeout(() => this.initAutocomplete(), 0);
  }

  protected closeForm(): void {
    this.formOpen.set(false);
    this.cleanupAutocomplete();
  }

  protected clearFormLocation(): void {
    this.draft.locationLat = null;
    this.draft.locationLng = null;
    this.draft.locationAddress = '';
    this.hasFormLocation.set(false);
    this.formMapCenter.set(DEFAULT_CENTER);
    if (this.locationInputRef?.nativeElement) {
      this.locationInputRef.nativeElement.value = '';
    }
  }

  protected save(): void {
    const d = this.draft;
    if (!d.title.trim() || !d.description.trim()) return;

    const payload = {
      title: d.title.trim(),
      description: d.description.trim(),
      startDate: d.startDate ? new Date(d.startDate).toISOString() : undefined,
      endDate: d.endDate ? new Date(d.endDate).toISOString() : undefined,
      paymentMethod: d.paymentMethod || undefined,
      paymentAmount: d.paymentAmount ?? undefined,
      paymentCurrency: d.paymentCurrency || undefined,
      locationLat: d.locationLat ?? undefined,
      locationLng: d.locationLng ?? undefined,
    };

    if (d.id) {
      this.jobService.update(d.id, payload).subscribe({
        next: ({ job }) => {
          this.allJobs.update((list) => list.map((j) => (j.id === job.id ? job : j)));
          this.closeForm();
        },
        error: (err) => this.error.set(err?.error?.error || 'Failed to update job'),
      });
    } else {
      this.jobService.create(payload).subscribe({
        next: ({ job }) => {
          this.allJobs.update((list) => [job, ...list]);
          this.closeForm();
        },
        error: (err) => this.error.set(err?.error?.error || 'Failed to create job'),
      });
    }
  }

  protected delete(id: string): void {
    this.jobService.delete(id).subscribe({
      next: () => {
        this.allJobs.update((list) => list.filter((j) => j.id !== id));
        if (this.selectedJobId() === id) this.selectedJobId.set(null);
      },
      error: (err) => this.error.set(err?.error?.error || 'Failed to delete job'),
    });
  }

  protected isMyJob(job: JobWithOwner): boolean {
    return job.ownerId === this.user()?.id;
  }

  protected statusLabel(status: JobStatus): string {
    const map: Record<JobStatus, string> = {
      pending: 'Open',
      accepted: 'Accepted',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return map[status] ?? status;
  }

  protected petsCount(job: JobWithOwner): number {
    return (job.pets?.length ?? 0) + (job.plants?.length ?? 0) + (job.strayAnimals?.length ?? 0);
  }

  // ── Private ──────────────────────────────────────────────────────────────────

  private load(): void {
    this.loading.set(true);
    this.error.set('');
    this.jobService.list().subscribe({
      next: (jobs) => {
        this.allJobs.set(jobs);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.error || 'Failed to load jobs');
        this.loading.set(false);
      },
    });
  }

  private initAutocomplete(): void {
    const input = this.locationInputRef?.nativeElement;
    if (!input || typeof google === 'undefined' || !google.maps?.places) return;

    this.cleanupAutocomplete();

    this.autocomplete = new google.maps.places.Autocomplete(input, {
      types: ['geocode', 'establishment'],
    });

    this.autocomplete.addListener('place_changed', () => {
      const place = this.autocomplete!.getPlace();
      const loc = place.geometry?.location;
      if (!loc) return;

      this.draft.locationLat = loc.lat();
      this.draft.locationLng = loc.lng();
      this.draft.locationAddress = place.formatted_address ?? '';
      this.formMapCenter.set({ lat: loc.lat(), lng: loc.lng() });
      this.hasFormLocation.set(true);
      // draft is a plain object, so we nudge Angular to re-render the preview
      this.cdr.detectChanges();
    });
  }

  private cleanupAutocomplete(): void {
    if (this.autocomplete && typeof google !== 'undefined') {
      google.maps.event.clearInstanceListeners(this.autocomplete);
      this.autocomplete = undefined;
    }
  }

  private emptyDraft(): JobDraft {
    return {
      id: null,
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      paymentMethod: '',
      paymentAmount: null,
      paymentCurrency: 'ILS',
      locationLat: null,
      locationLng: null,
      locationAddress: '',
    };
  }
}
