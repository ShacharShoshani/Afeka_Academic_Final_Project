import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import type { DisplayMode } from '@livin/common';
import { AuthService } from '../../services/auth.service';
import { AuthExtService } from '../../services/auth-ext.service';

@Component({
  selector: 'app-settings',
  imports: [FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {
  protected readonly authService = inject(AuthService);
  private readonly authExt = inject(AuthExtService);
  private readonly router = inject(Router);

  // Change-password state
  protected readonly showChangePassword = signal(false);
  protected changePwd = { current: '', newPwd: '', confirm: '' };
  protected readonly changePwdError = signal('');
  protected readonly changePwdSuccess = signal('');
  protected readonly changePwdSaving = signal(false);

  protected readonly currentMode = computed(() => this.authService.user()?.displayMode ?? 'social');
  protected readonly isAdmin = computed(() => this.authService.user()?.role === 'admin');

  protected selectMode(mode: DisplayMode): void {
    if (this.currentMode() === mode) return;
    this.authService.updateDisplayMode(mode).subscribe();
  }

  protected openPreferences(): void {
    this.router.navigate(['/preferences']);
  }

  protected openAdminReports(): void {
    this.router.navigate(['/admin/reports']);
  }

  protected toggleChangePassword(): void {
    this.showChangePassword.update((v) => !v);
    this.changePwd = { current: '', newPwd: '', confirm: '' };
    this.changePwdError.set('');
    this.changePwdSuccess.set('');
  }

  protected submitChangePassword(): void {
    if (this.changePwdSaving()) return;
    if (this.changePwd.newPwd !== this.changePwd.confirm) {
      this.changePwdError.set('New passwords do not match.');
      return;
    }
    if (this.changePwd.newPwd.length < 8) {
      this.changePwdError.set('New password must be at least 8 characters.');
      return;
    }
    this.changePwdSaving.set(true);
    this.changePwdError.set('');
    this.authExt.changePassword(this.changePwd.current, this.changePwd.newPwd).subscribe({
      next: () => {
        this.changePwdSaving.set(false);
        this.changePwdSuccess.set('Password changed successfully.');
        this.changePwd = { current: '', newPwd: '', confirm: '' };
      },
      error: (e) => {
        this.changePwdSaving.set(false);
        this.changePwdError.set(e?.error?.error || 'Failed to change password.');
      },
    });
  }

  protected logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}
