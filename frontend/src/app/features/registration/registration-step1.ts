import { Component, computed, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserRole } from '@livin/common';
import { startWith } from 'rxjs';
import { ProgressBar } from '../../shared/components/progress-bar/progress-bar';

@Component({
  selector: 'app-registration-step1',
  imports: [ProgressBar, ReactiveFormsModule],
  templateUrl: './registration-step1.html',
  styleUrl: './registration-step1.css',
})
export class RegistrationStep1 {
  protected selectedRole = signal<`${UserRole}` | null>(null);

  protected registrationForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    residence: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  // Convert form status to a signal so the computed can track it
  private formStatus = toSignal(
    this.registrationForm.statusChanges.pipe(
      startWith(this.registrationForm.status),
      takeUntilDestroyed()
    )
  );

  protected canContinue = computed(() => {
    return this.selectedRole() !== null && this.formStatus() === 'VALID';
  });

  protected selectRole(role: `${UserRole}`): void {
    this.selectedRole.set(role);
  }

  protected onContinue(): void {
    const role = this.selectedRole();

    if (this.registrationForm.valid && role) {
      const formData = {
        role,
        ...this.registrationForm.getRawValue(),
      };
      // Will navigate to step 2 once it exists
      console.log('Registration Data Step 1:', formData);
    }
  }
}
