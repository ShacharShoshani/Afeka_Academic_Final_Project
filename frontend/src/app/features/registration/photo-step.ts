import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import type { User } from '@livin/common';
import { ProgressBar } from '../../shared/components/progress-bar/progress-bar';
import { AuthService } from '../../services/auth.service';
import { CareItemsService } from '../../services/care-items.service';
import { PreferencesService } from '../../services/preferences.service';
import { resetRegistration } from '../../store/user.actions';
import { CareItemDraft, HelperPrefs, RegistrationState } from '../../store/registration.model';

@Component({
  selector: 'app-photo-step',
  imports: [ProgressBar],
  templateUrl: './photo-step.html',
  styleUrls: ['./registration-common.css', './photo-step.css'],
})
export class PhotoStep {
  private readonly router = inject(Router);
  private readonly store: Store<{ user: RegistrationState }> = inject(Store);
  private readonly auth = inject(AuthService);
  private readonly careItems = inject(CareItemsService);
  private readonly preferences = inject(PreferencesService);

  private readonly state = signal<RegistrationState | null>(null);

  protected readonly profilePhoto = signal('');
  protected readonly petPhoto = signal('');
  protected readonly photoError = signal('');
  protected readonly loading = signal(false);
  protected readonly apiError = signal('');

  protected readonly isOwner = computed(() => this.state()?.role === 'owner');
  protected readonly totalSteps = computed<number>(() => (this.isOwner() ? 6 : 5));
  protected readonly stepNumber = computed<number>(() => (this.isOwner() ? 6 : 5));
  protected readonly firstItem = computed<CareItemDraft | undefined>(() => this.state()?.pendingCareItems?.[0]);

  private profileInput = viewChild<ElementRef<HTMLInputElement>>('profileInput');
  private petInput = viewChild<ElementRef<HTMLInputElement>>('petInput');

  constructor() {
    this.store.select('user').pipe(take(1)).subscribe((s) => this.state.set(s));
  }

  protected openProfilePicker(): void {
    this.profileInput()?.nativeElement.click();
  }
  protected openPetPicker(): void {
    this.petInput()?.nativeElement.click();
  }

  protected onProfileSelected(event: Event): void {
    this.readImage(event, (data) => this.profilePhoto.set(data));
  }
  protected onPetSelected(event: Event): void {
    this.readImage(event, (data) => this.petPhoto.set(data));
  }

  private readImage(event: Event, done: (data: string) => void): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.photoError.set('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.photoError.set('Image must be under 5MB');
      return;
    }
    this.photoError.set('');
    const reader = new FileReader();
    reader.onload = () => done(reader.result as string);
    reader.readAsDataURL(file);
  }

  protected removeProfile(): void {
    this.profilePhoto.set('');
  }
  protected removePet(): void {
    this.petPhoto.set('');
  }

  protected goBack(): void {
    this.router.navigate([this.isOwner() ? '/register/pets' : '/register/details']);
  }

  protected finish(): void {
    const s = this.state();
    if (!s || this.loading()) return;

    this.loading.set(true);
    this.apiError.set('');

    // Build a clean register payload — drop funnel-only fields.
    const { pendingCareItems: _items, helperPrefs: _prefs, id: _id, ...rest } = s;
    const payload = { ...rest, profilePhoto: this.profilePhoto() } as unknown as Omit<User, 'id'>;

    this.auth.register(payload).subscribe({
      next: () => {
        // Account exists now. Submit role-specific extras, then go home regardless.
        this.submitExtras(s, () => {
          this.store.dispatch(resetRegistration());
          this.loading.set(false);
          this.router.navigate(['/home']);
        });
      },
      error: (err) => {
        this.loading.set(false);
        const base = err.error?.error || err.error?.message || 'Registration failed. Please try again.';
        const details: Array<{ path: (string | number)[]; message: string }> | undefined = err.error?.details;
        const detailText = details?.length
          ? ' — ' + details.map((d) => `${d.path.join('.') || '(root)'}: ${d.message}`).join('; ')
          : '';
        this.apiError.set(base + detailText);
      },
    });
  }

  // Best-effort secondary writes. Failures here don't block reaching /home
  // (the account is already created; the user can finish in their profile).
  private submitExtras(s: RegistrationState, done: () => void): void {
    if (s.role === 'owner') {
      const item = s.pendingCareItems?.[0];
      if (!item) return done();
      const image = this.petPhoto() || item.image || '';
      const obs =
        item.kind === 'plant'
          ? this.careItems.createPlant({
              name: item.name || '',
              specialNeeds: item.specialNeeds || '',
              description: item.description || '',
              image,
              estimatedBirthDate: item.estimatedBirthDate ?? null,
              careDetails: item.careDetails ?? null,
            })
          : this.careItems.createPet({
              name: item.name || '',
              type: item.type || 'dogs',
              size: 'medium',
              specialNeeds: item.specialNeeds || '',
              description: item.description || '',
              allergies: item.allergies || '',
              friendliness: item.friendliness ?? null,
              image,
              estimatedBirthDate: item.estimatedBirthDate ?? null,
              careDetails: item.careDetails ?? null,
            });
      obs.subscribe({ next: () => done(), error: () => done() });
      return;
    }

    if (s.role === 'caretaker' && s.helperPrefs) {
      const p: HelperPrefs = s.helperPrefs;
      this.preferences
        .update({
          careTypesWanted: s.careTypes ?? [],
          services: p.services,
          availabilityWanted: p.availabilityWanted,
          canHostAtMine: p.canHostAtMine,
          canTravelToOther: p.canTravelToOther,
          workType: p.workType,
          paymentRateTypes: [],
          minPayment: null,
          maxPayment: null,
          maxDistanceKm: p.maxDistanceKm,
          residenceFilter: null,
        })
        .subscribe({ next: () => done(), error: () => done() });
      return;
    }

    done();
  }
}
