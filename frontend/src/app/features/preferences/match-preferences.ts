import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import type {
  Availability,
  CareType,
  PaymentRateType,
  ServiceType,
  WorkType,
} from '@livin/common';
import { PreferencesService } from '../../services/preferences.service';

const ALL_CARE_TYPES: CareType[] = ['dogs', 'cats', 'birds', 'fish', 'rabbits', 'hamsters', 'reptiles', 'plants', 'stray_animals'];
const ALL_SERVICES: ServiceType[] = ['feeding', 'walking', 'watering_plants', 'cleaning', 'stray_care', 'other'];
const ALL_AVAILABILITY: Availability[] = ['mornings', 'afternoons', 'evenings', 'weekends'];
const ALL_RATE_TYPES: PaymentRateType[] = ['hourly', 'daily', 'weekly'];
const ALL_WORK_TYPES: WorkType[] = ['paid', 'volunteer', 'both'];

@Component({
  selector: 'app-match-preferences',
  imports: [FormsModule],
  templateUrl: './match-preferences.html',
  styleUrl: './match-preferences.css',
})
export class MatchPreferences implements OnInit {
  private readonly preferencesService = inject(PreferencesService);
  private readonly router = inject(Router);

  protected readonly allCareTypes = ALL_CARE_TYPES;
  protected readonly allServices = ALL_SERVICES;
  protected readonly allAvailability = ALL_AVAILABILITY;
  protected readonly allRateTypes = ALL_RATE_TYPES;
  protected readonly allWorkTypes = ALL_WORK_TYPES;

  protected readonly careTypesWanted = signal<CareType[]>([]);
  protected readonly services = signal<ServiceType[]>([]);
  protected readonly availabilityWanted = signal<Availability[]>([]);
  protected readonly paymentRateTypes = signal<PaymentRateType[]>([]);
  protected readonly canHostAtMine = signal(false);
  protected readonly canTravelToOther = signal(false);
  protected readonly workType = signal<WorkType>('both');
  protected readonly minPayment = signal<number | null>(null);
  protected readonly maxPayment = signal<number | null>(null);
  protected readonly maxDistanceKm = signal<number | null>(null);
  protected readonly residenceFilter = signal<string>('');

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly saved = signal(false);
  protected readonly error = signal('');

  ngOnInit(): void {
    this.preferencesService.get().subscribe({
      next: (p) => {
        this.careTypesWanted.set(p.careTypesWanted);
        this.services.set(p.services);
        this.availabilityWanted.set(p.availabilityWanted);
        this.paymentRateTypes.set(p.paymentRateTypes);
        this.canHostAtMine.set(p.canHostAtMine);
        this.canTravelToOther.set(p.canTravelToOther);
        this.workType.set(p.workType);
        this.minPayment.set(p.minPayment);
        this.maxPayment.set(p.maxPayment);
        this.maxDistanceKm.set(p.maxDistanceKm);
        this.residenceFilter.set(p.residenceFilter ?? '');
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load preferences');
        this.loading.set(false);
      },
    });
  }

  private toggle<T>(sig: ReturnType<typeof signal<T[]>>, value: T): void {
    const current = sig();
    sig.set(current.includes(value) ? current.filter((v) => v !== value) : [...current, value]);
    this.saved.set(false);
  }

  protected toggleCareType(v: CareType): void { this.toggle(this.careTypesWanted, v); }
  protected toggleService(v: ServiceType): void { this.toggle(this.services, v); }
  protected toggleAvailability(v: Availability): void { this.toggle(this.availabilityWanted, v); }
  protected toggleRateType(v: PaymentRateType): void { this.toggle(this.paymentRateTypes, v); }

  protected setWorkType(v: WorkType): void {
    this.workType.set(v);
    this.saved.set(false);
  }

  protected toggleHost(): void { this.canHostAtMine.update((v) => !v); this.saved.set(false); }
  protected toggleTravel(): void { this.canTravelToOther.update((v) => !v); this.saved.set(false); }

  protected onNumberInput(sig: ReturnType<typeof signal<number | null>>, raw: string): void {
    const n = raw.trim() === '' ? null : Number(raw);
    sig.set(n === null || Number.isNaN(n) ? null : Math.max(0, Math.round(n)));
    this.saved.set(false);
  }

  protected onResidenceInput(value: string): void {
    this.residenceFilter.set(value);
    this.saved.set(false);
  }

  protected save(): void {
    this.saving.set(true);
    this.error.set('');
    this.preferencesService
      .update({
        careTypesWanted: this.careTypesWanted(),
        services: this.services(),
        availabilityWanted: this.availabilityWanted(),
        canHostAtMine: this.canHostAtMine(),
        canTravelToOther: this.canTravelToOther(),
        workType: this.workType(),
        paymentRateTypes: this.paymentRateTypes(),
        minPayment: this.minPayment(),
        maxPayment: this.maxPayment(),
        maxDistanceKm: this.maxDistanceKm(),
        residenceFilter: this.residenceFilter().trim() || null,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.saved.set(true);
        },
        error: () => {
          this.saving.set(false);
          this.error.set('Failed to save preferences');
        },
      });
  }

  protected goBack(): void {
    this.router.navigate(['/settings']);
  }

  protected formatLabel(value: string): string {
    return value
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  protected isSelected<T>(list: T[], value: T): boolean {
    return list.includes(value);
  }
}
