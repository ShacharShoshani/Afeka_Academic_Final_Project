import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { startWith } from 'rxjs';
import type { User } from '@livin/common';
import { ProgressBar } from '../../shared/components/progress-bar/progress-bar';
import { setUserData } from 'src/app/store/user.actions';

interface CountryCode {
  prefix: string;
  flag: string;
  name: string;
}

const COUNTRY_CODES: CountryCode[] = [
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
  { prefix: '+90', flag: '🇹🇷', name: 'Turkey' },
  { prefix: '+20', flag: '🇪🇬', name: 'Egypt' },
  { prefix: '+27', flag: '🇿🇦', name: 'South Africa' },
  { prefix: '+82', flag: '🇰🇷', name: 'South Korea' },
];

// How long to wait for the Geocoder Promise before giving up.
// If Maps is in a bad state, the Promise may never settle without this.
const GEOCODER_TIMEOUT_MS = 8_000;

@Component({
  selector: 'app-registration-step2',
  imports: [ProgressBar, ReactiveFormsModule],
  templateUrl: './registration-step2.html',
  styleUrl: './registration-step2.css',
})
export class RegistrationStep2 implements AfterViewInit, OnDestroy {
  @ViewChild('residenceInput') private residenceInputRef?: ElementRef<HTMLInputElement>;

  private readonly store: Store<{ user: User }> = inject(Store);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  private autocomplete?: google.maps.places.Autocomplete;
  // Unsubscribe handle for the late-firing gm_authFailure custom event
  private removeAuthFailureListener?: () => void;

  protected readonly countryCodes = COUNTRY_CODES;
  protected readonly selectedCodePrefix = signal('+972');
  protected readonly residenceAddress = signal('');
  protected readonly residenceConfirmed = signal(false);
  protected readonly residenceTouched = signal(false);
  protected readonly locationLoading = signal(false);
  protected readonly locationError = signal('');
  // null = not yet checked, true = working, false = unavailable / auth failed
  protected readonly mapsAvailable = signal<boolean | null>(null);

  protected personalForm = new FormGroup({
    firstName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, RegistrationStep2.nameValidator],
    }),
    lastName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, RegistrationStep2.nameValidator],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    phoneNumber: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, RegistrationStep2.phoneValidator],
    }),
  });

  private formStatus = toSignal(
    this.personalForm.statusChanges.pipe(startWith(this.personalForm.status), takeUntilDestroyed())
  );

  protected readonly canContinue = computed(() => {
    if (this.formStatus() !== 'VALID') return false;
    // Fallback mode: any non-empty typed address is acceptable
    if (this.mapsAvailable() === false) return this.residenceAddress().trim().length > 0;
    return this.residenceConfirmed();
  });

  // ── Validators ─────────────────────────────────────────────────────────────

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

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  ngAfterViewInit(): void {
    // setTimeout(0) defers until after the current rendering cycle so ViewChild
    // refs are stable. By this point the Maps script has loaded (main.ts awaits
    // it before bootstrapping), but gm_authFailure may not have fired yet because
    // Google validates the key via a separate async XHR after the script parses.
    setTimeout(() => {
      if ((window as any).__mapsAuthFailed || typeof google === 'undefined' || !google.maps?.places) {
        this.mapsAvailable.set(false);
        return;
      }

      // Subscribe to the late-firing auth-failure event BEFORE init so we never
      // miss it if the XHR comes back while the user is already on the page.
      const handler = () => this.onMapsAuthFailure();
      window.addEventListener('gm-auth-failure', handler, { once: true });
      this.removeAuthFailureListener = () =>
        window.removeEventListener('gm-auth-failure', handler);

      this.mapsAvailable.set(true);
      this.initAutocomplete();
    }, 0);
  }

  ngOnDestroy(): void {
    this.removeAuthFailureListener?.();
    this.destroyAutocomplete();
  }

  // ── Maps auth failure (fired asynchronously by Google) ─────────────────────

  private onMapsAuthFailure(): void {
    this.mapsAvailable.set(false);
    this.destroyAutocomplete();

    // Remove any .pac-container elements Google already injected into <body>
    document.querySelectorAll('.pac-container').forEach((el) => el.remove());

    // If the geolocation→geocoder flow was in progress, stop it now
    if (this.locationLoading()) {
      this.locationLoading.set(false);
      this.locationError.set('Location services are unavailable. Please type your address.');
    }

    this.cdr.detectChanges();
  }

  // ── Autocomplete helpers ────────────────────────────────────────────────────

  private initAutocomplete(): void {
    this.destroyAutocomplete(); // guard against double-init
    const input = this.residenceInputRef?.nativeElement;
    if (!input || typeof google === 'undefined' || !google.maps?.places) return;

    this.autocomplete = new google.maps.places.Autocomplete(input, { types: ['geocode'] });
    this.autocomplete.addListener('place_changed', () => {
      const place = this.autocomplete!.getPlace();
      const address = place.formatted_address ?? place.name ?? '';
      if (!address) return;
      this.residenceAddress.set(address);
      this.residenceConfirmed.set(true);
      this.locationError.set('');
      this.cdr.detectChanges();
    });
  }

  private destroyAutocomplete(): void {
    if (this.autocomplete && typeof google !== 'undefined') {
      google.maps.event.clearInstanceListeners(this.autocomplete);
      this.autocomplete = undefined;
    }
  }

  // ── Template handlers ───────────────────────────────────────────────────────

  protected onCodeChange(event: Event): void {
    this.selectedCodePrefix.set((event.target as HTMLSelectElement).value);
  }

  protected onResidenceInput(event: Event): void {
    // Only track raw text in fallback (Maps unavailable) mode
    if (this.mapsAvailable() !== false) return;
    const val = (event.target as HTMLInputElement).value.trim();
    this.residenceAddress.set(val);
  }

  protected onResidenceBlur(): void {
    this.residenceTouched.set(true);
    if (this.mapsAvailable() === false) {
      // Plain-text fallback: accept whatever was typed
      const val = this.residenceInputRef?.nativeElement?.value.trim() ?? '';
      this.residenceAddress.set(val);
      return;
    }
    // Maps mode: clear unconfirmed free-text to prevent partial input from passing through
    if (!this.residenceConfirmed() && this.residenceInputRef?.nativeElement) {
      this.residenceInputRef.nativeElement.value = '';
    }
  }

  protected clearResidence(): void {
    this.residenceAddress.set('');
    this.residenceConfirmed.set(false);
    this.residenceTouched.set(false);
    this.locationError.set('');
    if (this.residenceInputRef?.nativeElement) {
      this.residenceInputRef.nativeElement.value = '';
    }
  }

  protected requestLiveLocation(): void {
    if (!navigator.geolocation) {
      this.locationError.set('Your browser does not support location access.');
      return;
    }
    this.locationLoading.set(true);
    this.locationError.set('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lng } = pos.coords;
          const geocoder = new google.maps.Geocoder();

          // Race the geocoder against a hard timeout.
          // When the Maps API key is invalid or the service is down, the Promise
          // may never settle — without a timeout this leaves the spinner forever.
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('geocoder-timeout')), GEOCODER_TIMEOUT_MS)
          );
          const response = await Promise.race([
            geocoder.geocode({ location: { lat, lng } }),
            timeoutPromise,
          ]);

          const result = response.results[0];
          if (!result) {
            this.locationError.set('Could not determine your address. Please select it manually.');
            return;
          }
          const address = result.formatted_address;
          this.residenceAddress.set(address);
          this.residenceConfirmed.set(true);
          this.locationError.set('');
          if (this.residenceInputRef?.nativeElement) {
            this.residenceInputRef.nativeElement.value = address;
          }
        } catch (err) {
          // If Maps auth failed during the geocoder call, switch to fallback mode
          if ((window as any).__mapsAuthFailed) {
            this.onMapsAuthFailure();
          } else {
            const isTimeout = err instanceof Error && err.message === 'geocoder-timeout';
            this.locationError.set(
              isTimeout
                ? 'Location lookup timed out. Please select your address manually.'
                : 'Could not determine your address. Please select it manually.'
            );
          }
        } finally {
          this.locationLoading.set(false);
          this.cdr.detectChanges();
        }
      },
      (err) => {
        this.locationLoading.set(false);
        if (err.code === err.PERMISSION_DENIED) {
          this.locationError.set('Location permission denied. Please select your address manually.');
        } else if (err.code === err.TIMEOUT) {
          this.locationError.set('Location request timed out. Please try again or select manually.');
        } else {
          this.locationError.set('Could not get your location. Please select your address manually.');
        }
        this.cdr.detectChanges();
      },
      { timeout: 10_000, maximumAge: 60_000, enableHighAccuracy: false },
    );
  }

  protected goBack(): void {
    this.router.navigate(['/register']);
  }

  protected onContinue(): void {
    if (!this.personalForm.valid) return;
    const mapsOk = this.mapsAvailable() !== false;
    if (mapsOk && !this.residenceConfirmed()) return;
    if (!mapsOk && !this.residenceAddress().trim()) return;

    const { firstName, lastName, email, phoneNumber } = this.personalForm.getRawValue();
    const name = `${firstName.trim()} ${lastName.trim()}`;
    const phone = `${this.selectedCodePrefix()}${phoneNumber.replace(/[\s\-]/g, '')}`;
    const residence = mapsOk
      ? this.residenceAddress()
      : (this.residenceInputRef?.nativeElement?.value.trim() ?? this.residenceAddress());

    this.store.dispatch(setUserData({ name, email, phone, residence }));
    this.router.navigate(['/register/step-3']);
  }
}
