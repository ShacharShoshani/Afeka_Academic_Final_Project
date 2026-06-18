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
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import type { UserRole } from '@livin/common';
import { ProgressBar } from '../../shared/components/progress-bar/progress-bar';
import { setUserData } from '../../store/user.actions';
import { RegistrationState } from '../../store/registration.model';
import { COUNTRIES, Country, flagEmoji } from '../../shared/data/countries';

const GEOCODER_TIMEOUT_MS = 8_000;

@Component({
  selector: 'app-location-step',
  imports: [ProgressBar],
  templateUrl: './location-step.html',
  styleUrls: ['./registration-common.css', './location-step.css'],
})
export class LocationStep implements AfterViewInit, OnDestroy {
  @ViewChild('addressInput') private addressInputRef?: ElementRef<HTMLInputElement>;

  private readonly store: Store<{ user: RegistrationState }> = inject(Store);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  private autocomplete?: google.maps.places.Autocomplete;
  private removeAuthFailureListener?: () => void;

  protected readonly flagEmoji = flagEmoji;
  protected readonly role = toSignal(this.store.select('user').pipe(map((u) => u.role)));
  protected readonly totalSteps = computed<number>(() => (this.role() === 'owner' ? 6 : 5));

  // null = not yet checked, true = working, false = unavailable / auth failed
  protected readonly mapsAvailable = signal<boolean | null>(null);
  protected readonly locationLoading = signal(false);
  protected readonly locationError = signal('');

  // Structured address fields.
  protected readonly countryName = signal('');
  protected readonly countryCode = signal('');
  protected readonly city = signal('');
  protected readonly street = signal('');
  protected readonly houseNumber = signal('');
  private lat: number | null = null;
  private lng: number | null = null;
  private formattedAddress = '';

  // Country dropdown (lightweight searchable combobox).
  protected readonly countryQuery = signal('');
  protected readonly countryOpen = signal(false);
  protected readonly filteredCountries = computed<Country[]>(() => {
    const q = this.countryQuery().trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q);
  });

  protected readonly canContinue = computed(
    () => this.countryName().trim().length > 0 && this.city().trim().length > 0,
  );

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngAfterViewInit(): void {
    setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).__mapsAuthFailed || typeof google === 'undefined' || !google.maps?.places) {
        this.mapsAvailable.set(false);
        return;
      }
      const handler = () => this.onMapsAuthFailure();
      window.addEventListener('gm-auth-failure', handler, { once: true });
      this.removeAuthFailureListener = () => window.removeEventListener('gm-auth-failure', handler);

      this.mapsAvailable.set(true);
      this.initAutocomplete();
    }, 0);
  }

  ngOnDestroy(): void {
    this.removeAuthFailureListener?.();
    this.destroyAutocomplete();
  }

  // ── Maps auth failure ───────────────────────────────────────────────────
  private onMapsAuthFailure(): void {
    this.mapsAvailable.set(false);
    this.destroyAutocomplete();
    document.querySelectorAll('.pac-container').forEach((el) => el.remove());
    if (this.locationLoading()) {
      this.locationLoading.set(false);
      this.locationError.set('Location services are unavailable. Please enter your address below.');
    }
    this.cdr.detectChanges();
  }

  // ── Autocomplete ──────────────────────────────────────────────────────────
  private initAutocomplete(): void {
    this.destroyAutocomplete();
    const input = this.addressInputRef?.nativeElement;
    if (!input || typeof google === 'undefined' || !google.maps?.places) return;

    const options: google.maps.places.AutocompleteOptions = { types: ['address'] };
    if (this.countryCode()) {
      options.componentRestrictions = { country: this.countryCode().toLowerCase() };
    }
    this.autocomplete = new google.maps.places.Autocomplete(input, options);
    this.autocomplete.setFields(['address_components', 'geometry', 'formatted_address', 'name']);
    this.autocomplete.addListener('place_changed', () => {
      const place = this.autocomplete!.getPlace();
      if (place.address_components) this.applyComponents(place.address_components);
      this.formattedAddress = place.formatted_address ?? place.name ?? this.formattedAddress;
      const loc = place.geometry?.location;
      this.lat = loc ? loc.lat() : this.lat;
      this.lng = loc ? loc.lng() : this.lng;
      this.locationError.set('');
      // Clear the search box — values now live in the structured fields below.
      if (this.addressInputRef?.nativeElement) this.addressInputRef.nativeElement.value = '';
      this.cdr.detectChanges();
    });
  }

  private destroyAutocomplete(): void {
    if (this.autocomplete && typeof google !== 'undefined') {
      google.maps.event.clearInstanceListeners(this.autocomplete);
      this.autocomplete = undefined;
    }
  }

  private applyComponents(components: google.maps.GeocoderAddressComponent[]): void {
    const get = (type: string, short = false) => {
      const c = components.find((x) => x.types.includes(type));
      return c ? (short ? c.short_name : c.long_name) : '';
    };
    const streetNumber = get('street_number');
    const route = get('route');
    const locality =
      get('locality') || get('postal_town') || get('sublocality_level_1') || get('administrative_area_level_2');
    const countryLong = get('country');
    const countryShort = get('country', true);

    if (route) this.street.set(route);
    if (streetNumber) this.houseNumber.set(streetNumber);
    if (locality) this.city.set(locality);
    if (countryLong) {
      this.countryName.set(countryLong);
      this.countryCode.set(countryShort);
      this.countryQuery.set(countryLong);
    }
  }

  // ── Country dropdown ────────────────────────────────────────────────────
  protected onCountryInput(event: Event): void {
    this.countryQuery.set((event.target as HTMLInputElement).value);
    this.countryOpen.set(true);
  }

  protected openCountry(): void {
    this.countryOpen.set(true);
  }

  protected closeCountrySoon(): void {
    // Delay so a click on an option registers before the list closes.
    setTimeout(() => this.countryOpen.set(false), 150);
  }

  protected selectCountry(c: Country): void {
    this.countryName.set(c.name);
    this.countryCode.set(c.code);
    this.countryQuery.set(c.name);
    this.countryOpen.set(false);
    // Re-scope the address autocomplete to the chosen country.
    if (this.mapsAvailable()) this.initAutocomplete();
  }

  // ── Manual field handlers ─────────────────────────────────────────────────
  protected onCity(event: Event): void {
    this.city.set((event.target as HTMLInputElement).value);
  }
  protected onStreet(event: Event): void {
    this.street.set((event.target as HTMLInputElement).value);
  }
  protected onHouseNumber(event: Event): void {
    this.houseNumber.set((event.target as HTMLInputElement).value);
  }

  // ── Live location ─────────────────────────────────────────────────────────
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
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('geocoder-timeout')), GEOCODER_TIMEOUT_MS),
          );
          const response = await Promise.race([geocoder.geocode({ location: { lat, lng } }), timeoutPromise]);
          const result = response.results[0];
          if (!result) {
            this.locationError.set('Could not determine your address. Please enter it manually below.');
            return;
          }
          if (result.address_components) this.applyComponents(result.address_components);
          this.formattedAddress = result.formatted_address;
          this.lat = lat;
          this.lng = lng;
          this.locationError.set('');
        } catch (err) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((window as any).__mapsAuthFailed) {
            this.onMapsAuthFailure();
          } else {
            const isTimeout = err instanceof Error && err.message === 'geocoder-timeout';
            this.locationError.set(
              isTimeout
                ? 'Location lookup timed out. Please enter your address manually below.'
                : 'Could not determine your address. Please enter it manually below.',
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
          this.locationError.set('No problem — you can enter your address manually below.');
        } else if (err.code === err.TIMEOUT) {
          this.locationError.set('Location request timed out. Please enter your address manually below.');
        } else {
          this.locationError.set('Could not get your location. Please enter your address manually below.');
        }
        this.cdr.detectChanges();
      },
      { timeout: 10_000, maximumAge: 60_000, enableHighAccuracy: false },
    );
  }

  // ── Navigation ─────────────────────────────────────────────────────────────
  protected goBack(): void {
    this.router.navigate(['/register']);
  }

  protected onContinue(): void {
    if (!this.canContinue()) return;

    const city = this.city().trim();
    const country = this.countryName().trim();
    // Public, city-level display label — never exposes the house number.
    const residence = [city, country].filter(Boolean).join(', ');

    this.store.dispatch(
      setUserData({
        residence,
        city,
        country,
        countryCode: this.countryCode() || null,
        street: this.street().trim() || null,
        houseNumber: this.houseNumber().trim() || null,
        formattedAddress: this.formattedAddress.trim() || residence,
        lat: this.lat,
        lng: this.lng,
      }),
    );
    this.router.navigate(['/register/about']);
  }
}
