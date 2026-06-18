import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';
import { Availability, CareType, ServiceType, WorkType } from '@livin/common';
import { ProgressBar } from '../../shared/components/progress-bar/progress-bar';
import { CareTypeChips } from '../../shared/components/care-type-chips/care-type-chips';
import { setUserData, setHelperPrefs } from '../../store/user.actions';
import { RegistrationState } from '../../store/registration.model';

@Component({
  selector: 'app-details-step',
  imports: [ProgressBar, CareTypeChips],
  templateUrl: './details-step.html',
  styleUrls: ['./registration-common.css', './details-step.css'],
})
export class DetailsStep {
  private readonly router = inject(Router);
  private readonly store: Store<{ user: RegistrationState }> = inject(Store);

  protected readonly role = toSignal(this.store.select('user').pipe(map((u) => u.role)));
  protected readonly isOwner = computed(() => this.role() === 'owner');
  protected readonly totalSteps = computed<number>(() => (this.role() === 'owner' ? 6 : 5));

  // Owner
  protected readonly selectedCareTypes = signal<CareType[]>([]);

  // Caretaker
  protected readonly selectedServices = signal<ServiceType[]>([]);
  protected readonly selectedAvailability = signal<Availability[]>([]);
  protected readonly workType = signal<WorkType>('both');
  protected readonly canHost = signal(false);
  protected readonly canTravel = signal(true);
  protected readonly maxDistanceKm = signal<number | null>(null);

  protected readonly serviceOptions: { value: ServiceType; label: string }[] = [
    { value: 'feeding', label: 'Feeding' },
    { value: 'walking', label: 'Walking' },
    { value: 'watering_plants', label: 'Watering plants' },
    { value: 'cleaning', label: 'Cleaning' },
    { value: 'stray_care', label: 'Stray care' },
    { value: 'other', label: 'Other' },
  ];

  protected readonly availabilityOptions: { value: Availability; label: string }[] = [
    { value: 'mornings', label: 'Mornings' },
    { value: 'afternoons', label: 'Afternoons' },
    { value: 'evenings', label: 'Evenings' },
    { value: 'weekends', label: 'Weekends' },
  ];

  protected readonly workTypeOptions: { value: WorkType; label: string }[] = [
    { value: 'paid', label: 'Paid' },
    { value: 'volunteer', label: 'Volunteer' },
    { value: 'both', label: 'Both' },
  ];

  protected readonly distanceOptions = [5, 10, 20, 50];

  protected readonly canContinue = computed(() => {
    if (this.isOwner()) return this.selectedCareTypes().length > 0;
    return this.selectedAvailability().length > 0; // caretaker: at least one availability
  });

  // ── Toggles ────────────────────────────────────────────────────────────
  protected toggleCareType(type: CareType): void {
    this.selectedCareTypes.update((c) => (c.includes(type) ? c.filter((t) => t !== type) : [...c, type]));
  }
  protected toggleService(s: ServiceType): void {
    this.selectedServices.update((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
  }
  protected toggleAvailability(a: Availability): void {
    this.selectedAvailability.update((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]));
  }
  protected isService(s: ServiceType): boolean {
    return this.selectedServices().includes(s);
  }
  protected isAvailability(a: Availability): boolean {
    return this.selectedAvailability().includes(a);
  }
  protected setWorkType(w: WorkType): void {
    this.workType.set(w);
  }
  protected setDistance(km: number): void {
    this.maxDistanceKm.set(this.maxDistanceKm() === km ? null : km);
  }

  protected goBack(): void {
    this.router.navigate(['/register/about']);
  }

  protected onContinue(): void {
    if (!this.canContinue()) return;

    if (this.isOwner()) {
      this.store.dispatch(setUserData({ careTypes: this.selectedCareTypes() }));
      this.router.navigate(['/register/pets']);
      return;
    }

    // Caretaker — availability on the user + helper prefs seeded into MatchPreference.
    this.store.dispatch(setUserData({ availability: this.selectedAvailability() }));
    this.store.dispatch(
      setHelperPrefs({
        workType: this.workType(),
        services: this.selectedServices(),
        availabilityWanted: this.selectedAvailability(),
        canHostAtMine: this.canHost(),
        canTravelToOther: this.canTravel(),
        maxDistanceKm: this.maxDistanceKm(),
      }),
    );
    this.router.navigate(['/register/photo']);
  }
}
