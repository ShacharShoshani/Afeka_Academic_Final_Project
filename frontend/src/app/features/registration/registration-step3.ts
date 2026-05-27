import { Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, ReactiveFormsModule, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';
import { User, UserRole, CareType, Availability } from '@livin/common';
import { ProgressBar } from '../../shared/components/progress-bar/progress-bar';
import { setProfileData } from '../../store/user.actions';

@Component({
  selector: 'app-registration-step3',
  imports: [ProgressBar, ReactiveFormsModule],
  templateUrl: './registration-step3.html',
  styleUrl: './registration-step3.css',
})
export class RegistrationStep3 {
  private readonly router = inject(Router);
  private readonly store: Store<{ user: Partial<User> }> = inject(Store);

  protected role = toSignal(
    this.store.select('user').pipe(map((u) => u.role)),
  );

  protected readonly maxDob = computed(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 16);
    return d.toISOString().split('T')[0];
  });

  protected readonly minDob = computed(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 120);
    return d.toISOString().split('T')[0];
  });

  protected profileForm = new FormGroup({
    bio: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    dateOfBirth: new FormControl('', { nonNullable: true, validators: [Validators.required, RegistrationStep3.dateOfBirthValidator] }),
  });

  private static dateOfBirthValidator(control: AbstractControl): ValidationErrors | null {
    const val = control.value as string;
    if (!val) return null;
    const date = new Date(val);
    if (isNaN(date.getTime())) return { invalidDate: true };
    const now = new Date();
    if (date >= now) return { future: true };
    const age = now.getFullYear() - date.getFullYear() - (
      now.getMonth() < date.getMonth() || (now.getMonth() === date.getMonth() && now.getDate() < date.getDate()) ? 1 : 0
    );
    if (age < 16) return { tooYoung: true };
    if (age > 120) return { tooOld: true };
    return null;
  }

  protected selectedCareTypes = signal<CareType[]>([]);
  protected selectedAvailability = signal<Availability[]>([]);

  private formStatus = toSignal(
    this.profileForm.statusChanges.pipe(map((s) => s)),
    { initialValue: this.profileForm.status },
  );

  protected canContinue = computed(
    () => this.formStatus() === 'VALID' && this.selectedCareTypes().length > 0,
  );

  protected careTypeOptions: { value: CareType; label: string }[] = [
    { value: 'dogs', label: 'Dogs' },
    { value: 'cats', label: 'Cats' },
    { value: 'birds', label: 'Birds' },
    { value: 'fish', label: 'Fish' },
    { value: 'rabbits', label: 'Rabbits' },
    { value: 'hamsters', label: 'Hamsters' },
    { value: 'reptiles', label: 'Reptiles' },
    { value: 'plants', label: 'Plants' },
    { value: 'stray_animals', label: 'Stray Animals' },
  ];

  protected availabilityOptions: { value: Availability; label: string }[] = [
    { value: 'mornings', label: 'Mornings' },
    { value: 'afternoons', label: 'Afternoons' },
    { value: 'evenings', label: 'Evenings' },
    { value: 'weekends', label: 'Weekends' },
  ];

  protected toggleCareType(type: CareType): void {
    this.selectedCareTypes.update((current) =>
      current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type],
    );
  }

  protected toggleAvailability(slot: Availability): void {
    this.selectedAvailability.update((current) =>
      current.includes(slot)
        ? current.filter((s) => s !== slot)
        : [...current, slot],
    );
  }

  protected isCareTypeSelected(type: CareType): boolean {
    return this.selectedCareTypes().includes(type);
  }

  protected isAvailabilitySelected(slot: Availability): boolean {
    return this.selectedAvailability().includes(slot);
  }

  protected goBack(): void {
    this.router.navigate(['/register/step-2']);
  }

  protected onContinue(): void {
    const { bio, dateOfBirth } = this.profileForm.getRawValue();
    this.store.dispatch(
      setProfileData({
        bio,
        dateOfBirth,
        careTypes: this.selectedCareTypes(),
        availability: this.selectedAvailability(),
      }),
    );
    this.router.navigate(['/register/step-4']);
  }
}
