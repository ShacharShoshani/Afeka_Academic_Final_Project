import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthExtService } from '../../services/auth-ext.service';

@Component({
  selector: 'app-forgot-password',
  imports: [FormsModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <h1 class="auth-title">Forgot Password</h1>
        <p class="auth-sub">Enter your email and we will generate a reset token.</p>
        @if (sent()) {
          <div class="auth-success">
            <p>Reset token generated.</p>
            @if (devToken()) {
              <p class="dev-note">Dev mode token: <code>{{ devToken() }}</code></p>
              <button class="auth-btn" (click)="goToReset()">Continue to Reset</button>
            }
          </div>
        } @else {
          <label class="auth-label">Email</label>
          <input class="auth-input" type="email" [(ngModel)]="email" placeholder="you@example.com" />
          @if (error()) { <p class="auth-error">{{ error() }}</p> }
          <button class="auth-btn" (click)="submit()" [disabled]="loading()">
            {{ loading() ? 'Sending…' : 'Send reset token' }}
          </button>
          <a class="auth-link" routerLink="/login">Back to login</a>
        }
      </div>
    </div>
  `,
  styleUrl: './auth-pages.css',
})
export class ForgotPassword {
  private readonly authExt = inject(AuthExtService);
  private readonly router = inject(Router);

  protected email = '';
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly sent = signal(false);
  protected readonly devToken = signal('');

  protected submit(): void {
    if (!this.email.trim()) return;
    this.loading.set(true);
    this.error.set('');
    this.authExt.forgotPassword(this.email.trim()).subscribe({
      next: (r) => {
        this.loading.set(false);
        this.sent.set(true);
        if (r.token) this.devToken.set(r.token);
      },
      error: () => { this.loading.set(false); this.error.set('Something went wrong. Try again.'); },
    });
  }

  protected goToReset(): void {
    this.router.navigate(['/reset-password'], { queryParams: { token: this.devToken() } });
  }
}
