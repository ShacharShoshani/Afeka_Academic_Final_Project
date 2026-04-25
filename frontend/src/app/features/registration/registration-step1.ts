import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { User, UserRole } from '@livin/common';
import { ProgressBar } from '../../shared/components/progress-bar/progress-bar';
import { setUserData } from 'src/app/store/user.actions';

@Component({
  selector: 'app-registration-step1',
  imports: [ProgressBar],
  templateUrl: './registration-step1.html',
  styleUrl: './registration-step1.css',
})
export class RegistrationStep1 {
  private readonly store: Store<{ user: User }> = inject(Store);
  private readonly router = inject(Router);
  protected selectedRole = signal<UserRole | null>(null);
  protected canContinue = computed(() => this.selectedRole() !== null);

  protected selectRole(role: UserRole): void {
    this.selectedRole.set(role);
  }

  protected onContinue(): void {
    const role = this.selectedRole();
    if (!role) return;

    this.store.dispatch(setUserData({ role }));
    this.router.navigate(['/register/step-2']);
  }
}
