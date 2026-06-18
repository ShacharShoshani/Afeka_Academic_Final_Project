import { Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, ReactiveFormsModule, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';
import { CareType } from '@livin/common';
import { ProgressBar } from '../../shared/components/progress-bar/progress-bar';
import { CareTypeChips } from '../../shared/components/care-type-chips/care-type-chips';
import { setProfileData } from '../../store/user.actions';
import { RegistrationState } from '../../store/registration.model';

@Component({
  selector: 'app-about-step',
  imports: [ProgressBar, ReactiveFormsModule, CareTypeChips],
  templateUrl: './about-step.html',
  styleUrls: ['./registration-common.css', './about-step.css'],
})
export class AboutStep {
  private readonly router = inject(Router);
  private readonly store: Store<{ user: RegistrationState }> = inject(Store);

  protected readonly role = toSignal(this.store.select('user').pipe(map((u) => u.role)));
  protected readonly isCaretaker = computed(() => this.role() === 'caretaker');
  protected readonly totalSteps = computed<number>(() => (this.role() === 'owner' ? 6 : 5));

  protected readonly selectedCareTypes = signal<CareType[]>([]);

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

  protected form = new FormGroup({
    bio: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(10)] }),
    dateOfBirth: new FormControl('', { nonNullable: true, validators: [Validators.required, AboutStep.dobValidator] }),
  });

  private formStatus = toSignal(this.form.statusChanges.pipe(map((s) => s)), { initialValue: this.form.status });

  protected readonly canContinue = computed(() => {
    if (this.formStatus() !== 'VALID') return false;
    if (this.isCaretaker()) return this.selectedCareTypes().length > 0;
    return true;
  });

  private static dobValidator(control: AbstractControl): ValidationErrors | null {
    const val = control.value as string;
    if (!val) return null;
    const date = new Date(val);
    if (isNaN(date.getTime())) return { invalidDate: true };
    const now = new Date();
    if (date >= now) return { future: true };
    const age =
      now.getFullYear() - date.getFullYear() -
      (now.getMonth() < date.getMonth() || (now.getMonth() === date.getMonth() && now.getDate() < date.getDate()) ? 1 : 0);
    if (age < 16) return { tooYoung: true };
    if (age > 120) return { tooOld: true };
    return null;
  }

  protected ctrl(name: string): AbstractControl {
    return this.form.get(name)!;
  }

  protected toggleCareType(type: CareType): void {
    this.selectedCareTypes.update((cur) =>
      cur.includes(type) ? cur.filter((t) => t !== type) : [...cur, type],
    );
  }

  protected goBack(): void {
    this.router.navigate(['/register/location']);
  }

  protected onContinue(): void {
    if (!this.canContinue()) return;
    const { bio, dateOfBirth } = this.form.getRawValue();
    this.store.dispatch(
      setProfileData({
        bio: bio.trim(),
        dateOfBirth,
        // Caretaker picks care types here; owner picks them in the next step.
        careTypes: this.isCaretaker() ? this.selectedCareTypes() : [],
        availability: [],
      }),
    );
    this.router.navigate(['/register/details']);
  }
}
