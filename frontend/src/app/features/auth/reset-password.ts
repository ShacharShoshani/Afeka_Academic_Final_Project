import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthExtService } from '../../services/auth-ext.service';

@Component({
  selector: 'app-reset-password',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <h1 class="auth-title">Reset Password</h1>
        @if (done()) {
          <p class="auth-success">Password reset! <a routerLink="/login">Log in</a></p>
        } @else {
          <label class="auth-label">Reset Token</label>
          <input class="auth-input" type="text" [(ngModel)]="token" placeholder="Paste your token" />
          <label class="auth-label">New Password</label>
          <input class="auth-input" type="password" [(ngModel)]="password" placeholder="Min 8 chars, upper, lower, number, special" />
          @if (error()) { <p class="auth-error">{{ error() }}</p> }
          <button class="auth-btn" (click)="submit()" [disabled]="loading()">
            {{ loading() ? 'Resetting…' : 'Reset password' }}
          </button>
          <a class="auth-link" routerLink="/login">Back to login</a>
        }
      </div>
    </div>
  `,
  styleUrl: './auth-pages.css',
})
export class ResetPassword implements OnInit {
  private readonly authExt = inject(AuthExtService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected token = '';
  protected password = '';
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly done = signal(false);

  ngOnInit(): void {
    const t = this.route.snapshot.queryParamMap.get('token');
    if (t) this.token = t;
  }

  protected submit(): void {
    if (!this.token.trim() || !this.password) return;
    this.loading.set(true);
    this.error.set('');
    this.authExt.resetPassword(this.token.trim(), this.password).subscribe({
      next: () => { this.loading.set(false); this.done.set(true); },
      error: (e) => { this.loading.set(false); this.error.set(e?.error?.error || 'Invalid or expired token.'); },
    });
  }
}
