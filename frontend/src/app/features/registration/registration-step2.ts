import { Component, computed, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { startWith } from 'rxjs';
import { User } from '@livin/common';
import { ProgressBar } from '../../shared/components/progress-bar/progress-bar';
import { setUserData } from 'src/app/store/user.actions';

@Component({
  selector: 'app-registration-step2',
  imports: [ProgressBar, ReactiveFormsModule],
  templateUrl: './registration-step2.html',
  styleUrl: './registration-step2.css',
})
export class RegistrationStep2 {
  private readonly store: Store<{ user: User }> = inject(Store);
  private readonly router = inject(Router);

  protected personalForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    residence: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  private formStatus = toSignal(
    this.personalForm.statusChanges.pipe(
      startWith(this.personalForm.status),
      takeUntilDestroyed()
    )
  );

  protected canContinue = computed(() => this.formStatus() === 'VALID');

  protected goBack(): void {
    this.router.navigate(['/register']);
  }

  protected onContinue(): void {
    if (!this.personalForm.valid) return;

    this.store.dispatch(setUserData(this.personalForm.getRawValue()));
    this.router.navigate(['/register/step-3']);
  }
}
