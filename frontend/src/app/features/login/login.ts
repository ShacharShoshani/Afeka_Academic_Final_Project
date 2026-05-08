import { Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  protected showPassword = signal(false);
  protected loading = signal(false);
  protected apiError = signal<string>('');

  protected loginForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  private formStatus = toSignal(
    this.loginForm.statusChanges.pipe(map((s) => s)),
    { initialValue: this.loginForm.status },
  );

  protected canSubmit = computed(() => this.formStatus() === 'VALID' && !this.loading());

  protected toggleShowPassword(): void {
    this.showPassword.update((v) => !v);
  }

  protected onSubmit(): void {
    if (!this.canSubmit()) return;

    this.loading.set(true);
    this.apiError.set('');

    const { email, password } = this.loginForm.getRawValue();
    this.authService.login(email, password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading.set(false);
        this.apiError.set(err.error?.error || 'Login failed. Please try again.');
      },
    });
  }
}
