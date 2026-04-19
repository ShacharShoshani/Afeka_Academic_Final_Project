import { Component, computed, signal } from '@angular/core';
import { ProgressBar } from '../../shared/components/progress-bar/progress-bar';
import { UserRole } from '../../shared/models/registration.model';

@Component({
  selector: 'app-registration-step1',
  imports: [ProgressBar],
  templateUrl: './registration-step1.html',
  styleUrl: './registration-step1.css',
})
export class RegistrationStep1 {
  protected selectedRole = signal<UserRole | null>(null);
  protected canContinue = computed(() => this.selectedRole() !== null);

  protected selectRole(role: UserRole): void {
    this.selectedRole.set(role);
  }

  protected onContinue(): void {
    // Will navigate to step 2 once it exists
    console.log('Selected role:', this.selectedRole());
  }
}
