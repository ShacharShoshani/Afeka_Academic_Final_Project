import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';
import { CareType, PetCareDetails, PetFriendliness } from '@livin/common';
import { ProgressBar } from '../../shared/components/progress-bar/progress-bar';
import { setCareItems } from '../../store/user.actions';
import { CareItemDraft, RegistrationState } from '../../store/registration.model';

interface ItemOption {
  key: string;
  kind: 'pet' | 'plant';
  type?: string; // PetType
  label: string;
}

const CARE_LABELS: Record<CareType, string> = {
  dogs: 'Dog', cats: 'Cat', birds: 'Bird', fish: 'Fish', rabbits: 'Rabbit',
  hamsters: 'Hamster', reptiles: 'Reptile', plants: 'Plant', stray_animals: 'Stray animal',
};

@Component({
  selector: 'app-pet-details-step',
  imports: [ProgressBar, ReactiveFormsModule],
  templateUrl: './pet-details-step.html',
  styleUrls: ['./registration-common.css', './pet-details-step.css'],
})
export class PetDetailsStep {
  private readonly router = inject(Router);
  private readonly store: Store<{ user: RegistrationState }> = inject(Store);

  private readonly careTypes = toSignal(this.store.select('user').pipe(map((u) => u.careTypes ?? [])), {
    initialValue: [] as CareType[],
  });

  // Build the pickable item types from what the owner said they own.
  // Stray animals are reported separately, so they're not offered here.
  protected readonly itemOptions = computed<ItemOption[]>(() =>
    (this.careTypes() as CareType[])
      .filter((c) => c !== 'stray_animals')
      .map((c) =>
        c === 'plants'
          ? { key: 'plants', kind: 'plant' as const, label: 'Plant' }
          : { key: c, kind: 'pet' as const, type: c, label: CARE_LABELS[c] },
      ),
  );

  protected readonly selectedKey = signal<string>('');
  protected readonly selectedOption = computed<ItemOption | undefined>(() =>
    this.itemOptions().find((o) => o.key === this.selectedKey()),
  );
  protected readonly isPlant = computed(() => this.selectedOption()?.kind === 'plant');
  protected readonly isDog = computed(() => this.selectedOption()?.type === 'dogs');
  protected readonly isCat = computed(() => this.selectedOption()?.type === 'cats');

  protected readonly totalSteps = 6; // pet step only exists for owners
  protected readonly openSections = signal<Set<string>>(new Set());

  protected readonly friendlinessOptions: { value: PetFriendliness; label: string }[] = [
    { value: 'friendly', label: 'Friendly' },
    { value: 'cautious', label: 'Cautious' },
    { value: 'unknown', label: 'Unknown' },
  ];
  protected readonly friendliness = signal<PetFriendliness | null>(null);

  protected form = new FormGroup({
    name: new FormControl('', { nonNullable: true }),
    age: new FormControl('', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
    allergies: new FormControl('', { nonNullable: true }),
    specialNeeds: new FormControl('', { nonNullable: true }),
    // Medical
    vetName: new FormControl('', { nonNullable: true }),
    vetClinicAddress: new FormControl('', { nonNullable: true }),
    vetPhone: new FormControl('', { nonNullable: true }),
    emergencyClinic: new FormControl('', { nonNullable: true }),
    conditions: new FormControl('', { nonNullable: true }),
    medications: new FormControl('', { nonNullable: true }),
    medicationInstructions: new FormControl('', { nonNullable: true }),
    vaccinationNotes: new FormControl('', { nonNullable: true }),
    emName: new FormControl('', { nonNullable: true }),
    emPhone: new FormControl('', { nonNullable: true }),
    // Feeding
    feedSchedule: new FormControl('', { nonNullable: true }),
    feedAmount: new FormControl('', { nonNullable: true }),
    foodType: new FormControl('', { nonNullable: true }),
    treatInstructions: new FormControl('', { nonNullable: true }),
    foodAllergies: new FormControl('', { nonNullable: true }),
    waterBowlLocation: new FormControl('', { nonNullable: true }),
    waterInstructions: new FormControl('', { nonNullable: true }),
    // Behavior
    triggers: new FormControl('', { nonNullable: true }),
    stressSigns: new FormControl('', { nonNullable: true }),
    hidingPlaces: new FormControl('', { nonNullable: true }),
    houseRules: new FormControl('', { nonNullable: true }),
    sleepingLocation: new FormControl('', { nonNullable: true }),
    // Dog
    walksPerDay: new FormControl('', { nonNullable: true }),
    preferredWalkTimes: new FormControl('', { nonNullable: true }),
    reactionToOtherDogs: new FormControl('', { nonNullable: true }),
    leashInstructions: new FormControl('', { nonNullable: true }),
    // Cat
    litterBoxLocation: new FormControl('', { nonNullable: true }),
    cleaningFrequency: new FormControl('', { nonNullable: true }),
    litterDisposal: new FormControl('', { nonNullable: true }),
    windowBalconyRules: new FormControl('', { nonNullable: true }),
    catHidingPlaces: new FormControl('', { nonNullable: true }),
    // Plant
    wateringFrequency: new FormControl('', { nonNullable: true }),
    waterAmount: new FormControl('', { nonNullable: true }),
    sunlight: new FormControl('', { nonNullable: true }),
    fertilizer: new FormControl('', { nonNullable: true }),
    sensitiveNotes: new FormControl('', { nonNullable: true }),
    specialInstructions: new FormControl('', { nonNullable: true }),
    indoorOutdoor: new FormControl('', { nonNullable: true }),
  });

  // Booleans tracked as signals (tri-state via checkboxes).
  protected readonly treatsAllowed = signal(false);
  protected readonly canGoOnFurniture = signal(false);
  protected readonly goodWithPeople = signal(false);
  protected readonly goodWithChildren = signal(false);
  protected readonly goodWithAnimals = signal(false);
  protected readonly needsSupervision = signal(false);
  protected readonly pullsOnLeash = signal(false);
  protected readonly canBeOffLeash = signal(false);

  protected readonly hasItems = computed(() => this.itemOptions().length > 0);

  // Auto-select the first item when entering the step.
  constructor() {
    queueMicrotask(() => {
      if (!this.selectedKey() && this.itemOptions().length) {
        this.selectedKey.set(this.itemOptions()[0].key);
      }
    });
  }

  protected selectItem(key: string): void {
    this.selectedKey.set(key);
  }

  protected toggleSection(id: string): void {
    this.openSections.update((set) => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  protected isOpen(id: string): boolean {
    return this.openSections().has(id);
  }

  // Convert a whole-number age (years) into an approximate ISO birth date, so it
  // stays compatible with the `estimatedBirthDate` field used across the app.
  private static ageToBirthDate(age: string): string | null {
    const n = parseInt(age, 10);
    if (!Number.isFinite(n) || n < 0 || n > 100) return null;
    const d = new Date();
    d.setFullYear(d.getFullYear() - n);
    return d.toISOString();
  }

  private clean(obj: Record<string, unknown>): Record<string, unknown> | undefined {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'string' && v.trim()) out[k] = v.trim();
      else if (typeof v === 'boolean' && v) out[k] = v;
    }
    return Object.keys(out).length ? out : undefined;
  }

  private buildCareDetails(): PetCareDetails | undefined {
    const f = this.form.getRawValue();
    const isPlant = this.isPlant();

    const details: PetCareDetails = {};
    if (!isPlant) {
      details.medical = this.clean({
        vetName: f.vetName, vetClinicAddress: f.vetClinicAddress, vetPhone: f.vetPhone,
        emergencyClinic: f.emergencyClinic, conditions: f.conditions, medications: f.medications,
        medicationInstructions: f.medicationInstructions, vaccinationNotes: f.vaccinationNotes,
      });
      details.emergencyContact = this.clean({ name: f.emName, phone: f.emPhone });
      details.feeding = this.clean({
        schedule: f.feedSchedule, amount: f.feedAmount, foodType: f.foodType,
        treatsAllowed: this.treatsAllowed(), treatInstructions: f.treatInstructions,
        foodAllergies: f.foodAllergies, waterBowlLocation: f.waterBowlLocation, waterInstructions: f.waterInstructions,
      });
      details.behavior = this.clean({
        triggers: f.triggers, stressSigns: f.stressSigns, hidingPlaces: f.hidingPlaces,
        houseRules: f.houseRules, canGoOnFurniture: this.canGoOnFurniture(), sleepingLocation: f.sleepingLocation,
        goodWithPeople: this.goodWithPeople(), goodWithChildren: this.goodWithChildren(),
        goodWithAnimals: this.goodWithAnimals(), needsSupervision: this.needsSupervision(),
      });
      if (this.isDog()) {
        details.dogRoutine = this.clean({
          walksPerDay: f.walksPerDay, preferredWalkTimes: f.preferredWalkTimes, pullsOnLeash: this.pullsOnLeash(),
          reactionToOtherDogs: f.reactionToOtherDogs, canBeOffLeash: this.canBeOffLeash(), leashInstructions: f.leashInstructions,
        });
      }
      if (this.isCat()) {
        details.catRoutine = this.clean({
          litterBoxLocation: f.litterBoxLocation, cleaningFrequency: f.cleaningFrequency, litterDisposal: f.litterDisposal,
          windowBalconyRules: f.windowBalconyRules, indoorOutdoor: f.indoorOutdoor, hidingPlaces: f.catHidingPlaces,
        });
      }
    } else {
      details.plantCare = this.clean({
        plantType: f.name, wateringFrequency: f.wateringFrequency, waterAmount: f.waterAmount,
        sunlight: f.sunlight, indoorOutdoor: f.indoorOutdoor, fertilizer: f.fertilizer,
        sensitiveNotes: f.sensitiveNotes, specialInstructions: f.specialInstructions,
      });
    }

    // Drop undefined sections.
    const out = Object.fromEntries(Object.entries(details).filter(([, v]) => v !== undefined));
    return Object.keys(out).length ? (out as PetCareDetails) : undefined;
  }

  protected goBack(): void {
    this.router.navigate(['/register/details']);
  }

  protected skip(): void {
    this.store.dispatch(setCareItems([]));
    this.router.navigate(['/register/photo']);
  }

  protected saveAndContinue(): void {
    const opt = this.selectedOption();
    if (!opt) {
      this.skip();
      return;
    }
    const f = this.form.getRawValue();
    const draft: CareItemDraft = {
      kind: opt.kind,
      type: opt.type,
      name: f.name.trim(),
      estimatedBirthDate: opt.kind === 'pet' ? PetDetailsStep.ageToBirthDate(f.age) : null,
      description: f.description.trim(),
      specialNeeds: f.specialNeeds.trim(),
      allergies: opt.kind === 'pet' ? f.allergies.trim() : '',
      friendliness: opt.kind === 'pet' ? this.friendliness() : null,
      careDetails: this.buildCareDetails(),
    };
    this.store.dispatch(setCareItems([draft]));
    this.router.navigate(['/register/photo']);
  }
}
