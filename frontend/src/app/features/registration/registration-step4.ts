import { Component, computed, inject, signal, ElementRef, viewChild } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs';
import { User } from '@livin/common';
import { ProgressBar } from '../../shared/components/progress-bar/progress-bar';
import { setAccountData } from '../../store/user.actions';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-registration-step4',
  imports: [ProgressBar, ReactiveFormsModule],
  templateUrl: './registration-step4.html',
  styleUrl: './registration-step4.css',
})
export class RegistrationStep4 {
  private readonly router = inject(Router);
  private readonly store: Store<{ user: Partial<User> }> = inject(Store);
  private readonly authService = inject(AuthService);

  protected photoPreview = signal<string>('');
  protected photoError = signal<string>('');
  protected showPassword = signal(false);
  protected showConfirm = signal(false);
  protected loading = signal(false);
  protected apiError = signal<string>('');

  private fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  protected passwordForm = new FormGroup({
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
    confirmPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  }, { validators: RegistrationStep4.passwordsMatch });

  private formStatus = toSignal(
    this.passwordForm.statusChanges.pipe(map((s) => s)),
    { initialValue: this.passwordForm.status },
  );

  protected canContinue = computed(() => this.formStatus() === 'VALID');

  private static passwordsMatch(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return password === confirm ? null : { passwordMismatch: true };
  }

  protected openFilePicker(): void {
    this.fileInput()?.nativeElement.click();
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.photoError.set('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.photoError.set('Image must be under 5MB');
      return;
    }

    this.photoError.set('');
    const reader = new FileReader();
    reader.onload = () => {
      this.photoPreview.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  protected toggleShowPassword(): void {
    this.showPassword.update((v) => !v);
  }

  protected toggleShowConfirm(): void {
    this.showConfirm.update((v) => !v);
  }

  protected goBack(): void {
    this.router.navigate(['/register/step-3']);
  }

  protected onContinue(): void {
    const { password } = this.passwordForm.getRawValue();
    this.store.dispatch(
      setAccountData({
        profilePhoto: this.photoPreview(),
        password,
      }),
    );

    this.loading.set(true);
    this.apiError.set('');

    this.store.select('user').pipe(take(1)).subscribe((userData) => {
      this.authService.register({
        ...userData as Omit<User, 'id'>,
        profilePhoto: this.photoPreview(),
        password,
      }).subscribe({
        next: () => {
          this.loading.set(false);
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.loading.set(false);
          this.apiError.set(err.error?.error || 'Registration failed. Please try again.');
        },
      });
    });
  }
}
