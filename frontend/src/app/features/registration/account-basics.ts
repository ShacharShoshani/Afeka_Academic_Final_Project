import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { startWith } from 'rxjs';
import type { UserRole } from '@livin/common';
import { ProgressBar } from '../../shared/components/progress-bar/progress-bar';
import { setUserData } from '../../store/user.actions';
import { RegistrationState } from '../../store/registration.model';

interface DialCode {
  prefix: string;
  flag: string;
  name: string;
}

const DIAL_CODES: DialCode[] = [
  { prefix: '+972', flag: '🇮🇱', name: 'Israel' },
  { prefix: '+1', flag: '🇺🇸', name: 'USA / Canada' },
  { prefix: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { prefix: '+33', flag: '🇫🇷', name: 'France' },
  { prefix: '+49', flag: '🇩🇪', name: 'Germany' },
  { prefix: '+39', flag: '🇮🇹', name: 'Italy' },
  { prefix: '+34', flag: '🇪🇸', name: 'Spain' },
  { prefix: '+31', flag: '🇳🇱', name: 'Netherlands' },
  { prefix: '+7', flag: '🇷🇺', name: 'Russia' },
  { prefix: '+91', flag: '🇮🇳', name: 'India' },
  { prefix: '+86', flag: '🇨🇳', name: 'China' },
  { prefix: '+81', flag: '🇯🇵', name: 'Japan' },
  { prefix: '+55', flag: '🇧🇷', name: 'Brazil' },
  { prefix: '+61', flag: '🇦🇺', name: 'Australia' },
  { prefix: '+971', flag: '🇦🇪', name: 'UAE' },
  { prefix: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { prefix: '+90', flag: '🇹🇷', name: 'Türkiye' },
  { prefix: '+20', flag: '🇪🇬', name: 'Egypt' },
  { prefix: '+27', flag: '🇿🇦', name: 'South Africa' },
  { prefix: '+82', flag: '🇰🇷', name: 'South Korea' },
];

@Component({
  selector: 'app-account-basics',
  imports: [ProgressBar, ReactiveFormsModule, RouterLink],
  templateUrl: './account-basics.html',
  styleUrls: ['./registration-common.css', './account-basics.css'],
})
export class AccountBasics {
  private readonly store: Store<{ user: RegistrationState }> = inject(Store);
  private readonly router = inject(Router);

  protected readonly dialCodes = DIAL_CODES;
  protected readonly selectedDial = signal('+972');
  protected readonly selectedRole = signal<UserRole | null>(null);
  protected readonly showPassword = signal(false);
  protected readonly showConfirm = signal(false);

  protected readonly totalSteps = computed(() => (this.selectedRole() === 'owner' ? 6 : 5));

  protected form = new FormGroup(
    {
      firstName: new FormControl('', { nonNullable: true, validators: [Validators.required, AccountBasics.nameValidator] }),
      lastName: new FormControl('', { nonNullable: true, validators: [Validators.required, AccountBasics.nameValidator] }),
      email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
      phoneNumber: new FormControl('', { nonNullable: true, validators: [Validators.required, AccountBasics.phoneValidator] }),
      password: new FormControl('', { nonNullable: true, validators: [Validators.required, AccountBasics.passwordStrength] }),
      confirmPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    },
    { validators: AccountBasics.passwordsMatch },
  );

  private formStatus = toSignal(
    this.form.statusChanges.pipe(startWith(this.form.status), takeUntilDestroyed()),
  );

  private passwordValue = toSignal(
    this.form.get('password')!.valueChanges.pipe(startWith(''), takeUntilDestroyed()),
    { initialValue: '' },
  );

  protected readonly canContinue = computed(
    () => this.selectedRole() !== null && this.formStatus() === 'VALID',
  );

  protected readonly showStrengthRules = computed(() => this.passwordValue().length > 0);

  protected readonly passwordRules = computed(() => {
    const v = this.passwordValue();
    return [
      { label: 'At least 8 characters', ok: v.length >= 8 },
      { label: 'Uppercase letter', ok: /[A-Z]/.test(v) },
      { label: 'Lowercase letter', ok: /[a-z]/.test(v) },
      { label: 'Number', ok: /\d/.test(v) },
      { label: 'Special character (!@#$…)', ok: /[^A-Za-z0-9]/.test(v) },
    ];
  });

  // ── Validators ──────────────────────────────────────────────────────────
  private static nameValidator(control: AbstractControl): ValidationErrors | null {
    const val = (control.value as string).trim();
    if (!val) return null;
    if (val.length < 2) return { minlength: true };
    if (!/^[a-zA-ZÀ-ÿא-ת֐-׿' -]+$/.test(val)) return { invalidName: true };
    return null;
  }

  private static phoneValidator(control: AbstractControl): ValidationErrors | null {
    const val = (control.value as string).replace(/[\s\-]/g, '');
    if (!val) return null;
    if (!/^\d+$/.test(val)) return { invalidPhone: true };
    if (val.length < 5 || val.length > 15) return { invalidPhone: true };
    return null;
  }

  private static passwordStrength(control: AbstractControl): ValidationErrors | null {
    const v = control.value as string;
    if (!v) return null;
    const errors: Record<string, boolean> = {};
    if (v.length < 8) errors['minlength'] = true;
    if (!/[A-Z]/.test(v)) errors['missingUppercase'] = true;
    if (!/[a-z]/.test(v)) errors['missingLowercase'] = true;
    if (!/\d/.test(v)) errors['missingNumber'] = true;
    if (!/[^A-Za-z0-9]/.test(v)) errors['missingSpecial'] = true;
    return Object.keys(errors).length > 0 ? errors : null;
  }

  private static passwordsMatch(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return password === confirm ? null : { passwordMismatch: true };
  }

  // ── Handlers ────────────────────────────────────────────────────────────
  protected selectRole(role: UserRole): void {
    this.selectedRole.set(role);
  }

  protected onDialChange(event: Event): void {
    this.selectedDial.set((event.target as HTMLSelectElement).value);
  }

  protected toggleShowPassword(): void {
    this.showPassword.update((v) => !v);
  }

  protected toggleShowConfirm(): void {
    this.showConfirm.update((v) => !v);
  }

  protected ctrl(name: string): AbstractControl {
    return this.form.get(name)!;
  }

  protected onContinue(): void {
    const role = this.selectedRole();
    if (!role || this.form.invalid) return;

    const { firstName, lastName, email, phoneNumber, password } = this.form.getRawValue();
    const name = `${firstName.trim()} ${lastName.trim()}`;
    const phone = `${this.selectedDial()}${phoneNumber.replace(/[\s\-]/g, '')}`;

    this.store.dispatch(setUserData({ role, name, email: email.trim(), phone, password }));
    this.router.navigate(['/register/location']);
  }
}
