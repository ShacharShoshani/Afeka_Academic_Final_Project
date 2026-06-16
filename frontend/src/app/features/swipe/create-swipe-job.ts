import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import type { PaymentMethodEnum, Pet, Plant, ServiceType, StrayAnimal } from '@livin/common';
import { JobService } from '../../services/job.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment.local';

const ALL_SERVICES: ServiceType[] = ['feeding', 'walking', 'watering_plants', 'cleaning', 'stray_care', 'other'];
const ALL_PAYMENT_METHODS: PaymentMethodEnum[] = ['cash', 'bank_transfer', 'bit', 'paybox', 'check', 'paypal'];
const CURRENCIES = ['ILS', 'USD', 'EUR'] as const;
const RATE_TYPES = ['hourly', 'daily', 'weekly'] as const;
const FRIENDLINESS = ['friendly', 'cautious', 'unknown'] as const;
const GEOCODER_TIMEOUT = 8_000;

@Component({
  selector: 'app-create-swipe-job',
  imports: [FormsModule],
  templateUrl: './create-swipe-job.html',
  styleUrl: './create-swipe-job.css',
})
export class CreateSwipeJob implements OnInit, AfterViewInit {
  @ViewChild('locationInput') private locationInputRef?: ElementRef<HTMLInputElement>;

  private readonly http = inject(HttpClient);
  private readonly jobService = inject(JobService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly ALL_SERVICES = ALL_SERVICES;
  protected readonly ALL_PAYMENT_METHODS = ALL_PAYMENT_METHODS;
  protected readonly CURRENCIES = CURRENCIES;
  protected readonly RATE_TYPES = RATE_TYPES;
  protected readonly FRIENDLINESS = FRIENDLINESS;

  // Owner's existing care items
  protected readonly pets = signal<Pet[]>([]);
  protected readonly plants = signal<Plant[]>([]);
  protected readonly strays = signal<StrayAnimal[]>([]);
  protected readonly selectedPetId = signal<string | null>(null);
  protected readonly selectedPlantId = signal<string | null>(null);
  protected readonly selectedStrayId = signal<string | null>(null);

  // Form state
  protected title = '';
  protected description = '';
  protected behaviorNotes = '';
  protected careType: 'pet' | 'plant' | 'stray' | '' = '';
  protected services: ServiceType[] = [];
  protected friendliness: 'friendly' | 'cautious' | 'unknown' | '' = '';
  protected startDate = '';
  protected endDate = '';
  protected estimatedHours: number | null = null;
  protected isVolunteer = false;
  protected paymentAmount: number | null = null;
  protected minPayment: number | null = null;
  protected maxPayment: number | null = null;
  protected paymentRateType: 'hourly' | 'daily' | 'weekly' | '' = '';
  protected currency: 'ILS' | 'USD' | 'EUR' = 'ILS';
  protected paymentMethods: PaymentMethodEnum[] = [];

  // Location
  protected locationAddress = '';
  protected locationCity: string | null = null;
  protected locationCountry: string | null = null;
  protected locationLat: number | null = null;
  protected locationLng: number | null = null;
  protected readonly mapsAvailable = signal<boolean | null>(null);
  protected readonly locationError = signal('');
  protected readonly locationLoading = signal(false);

  protected readonly saving = signal(false);
  protected readonly saveError = signal('');

  private autocomplete?: google.maps.places.Autocomplete;
  private removeAuthFailureListener?: () => void;

  ngOnInit(): void {
    const uid = this.authService.user()?.id;
    if (!uid) return;
    this.http.get<Pet[]>(`${environment.apiUrl}/pets`, { withCredentials: true }).subscribe({ next: (p) => this.pets.set(p) });
    this.http.get<Plant[]>(`${environment.apiUrl}/plants`, { withCredentials: true }).subscribe({ next: (p) => this.plants.set(p) });
    this.http.get<StrayAnimal[]>(`${environment.apiUrl}/stray-animals`, { withCredentials: true }).subscribe({ next: (s) => this.strays.set(s) });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if ((window as any).__mapsAuthFailed || typeof google === 'undefined' || !google.maps?.places) {
        this.mapsAvailable.set(false);
        return;
      }
      const handler = () => this.mapsAvailable.set(false);
      window.addEventListener('gm-auth-failure', handler, { once: true });
      this.removeAuthFailureListener = () => window.removeEventListener('gm-auth-failure', handler);
      this.mapsAvailable.set(true);
      this.initAutocomplete();
    }, 0);
  }

  private initAutocomplete(): void {
    const input = this.locationInputRef?.nativeElement;
    if (!input || typeof google === 'undefined' || !google.maps?.places) return;
    this.autocomplete = new google.maps.places.Autocomplete(input, { types: ['geocode'] });
    this.autocomplete.addListener('place_changed', () => {
      const place = this.autocomplete!.getPlace();
      const address = place.formatted_address ?? place.name ?? '';
      if (!address) return;
      this.locationAddress = address;
      const loc = place.geometry?.location;
      this.locationLat = loc ? loc.lat() : null;
      this.locationLng = loc ? loc.lng() : null;
      if (place.address_components) {
        const get = (type: string) => place.address_components!.find((c) => c.types.includes(type))?.long_name ?? null;
        this.locationCity = get('locality') ?? get('administrative_area_level_2') ?? null;
        this.locationCountry = get('country');
      }
      this.locationError.set('');
      this.cdr.detectChanges();
    });
  }

  protected useCurrentLocation(): void {
    if (!navigator.geolocation) { this.locationError.set('Geolocation not supported.'); return; }
    this.locationLoading.set(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lng } = pos.coords;
          const geocoder = new google.maps.Geocoder();
          const timeout = new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), GEOCODER_TIMEOUT));
          const res = await Promise.race([geocoder.geocode({ location: { lat, lng } }), timeout]);
          const result = res.results[0];
          if (!result) { this.locationError.set('Could not determine address.'); return; }
          this.locationAddress = result.formatted_address;
          this.locationLat = lat;
          this.locationLng = lng;
          if (result.address_components) {
            const get = (type: string) => result.address_components!.find((c) => c.types.includes(type))?.long_name ?? null;
            this.locationCity = get('locality') ?? get('administrative_area_level_2') ?? null;
            this.locationCountry = get('country');
          }
          if (this.locationInputRef?.nativeElement) this.locationInputRef.nativeElement.value = this.locationAddress;
          this.locationError.set('');
        } catch { this.locationError.set('Could not resolve location. Type address manually.'); }
        finally { this.locationLoading.set(false); this.cdr.detectChanges(); }
      },
      () => { this.locationLoading.set(false); this.locationError.set('Location access denied.'); },
      { timeout: 10_000 },
    );
  }

  protected toggleService(s: ServiceType): void {
    const i = this.services.indexOf(s);
    if (i >= 0) this.services.splice(i, 1); else this.services.push(s);
  }

  protected togglePaymentMethod(m: PaymentMethodEnum): void {
    const i = this.paymentMethods.indexOf(m);
    if (i >= 0) this.paymentMethods.splice(i, 1); else this.paymentMethods.push(m);
  }

  protected formatService(s: ServiceType): string {
    return s.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  protected formatMethod(m: PaymentMethodEnum): string {
    return m.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  protected submit(): void {
    if (this.saving()) return;
    if (!this.title.trim()) { this.saveError.set('Job title is required.'); return; }
    if (!this.description.trim()) { this.saveError.set('Description is required.'); return; }
    if (!this.startDate || !this.endDate) { this.saveError.set('Start and end dates are required.'); return; }

    // Resolve care item IDs
    const petIds = this.selectedPetId() ? [this.selectedPetId()!] : [];
    const plantIds = this.selectedPlantId() ? [this.selectedPlantId()!] : [];
    const strayAnimalIds = this.selectedStrayId() ? [this.selectedStrayId()!] : [];

    this.saving.set(true);
    this.saveError.set('');

    this.jobService.create({
      title: this.title.trim(),
      description: this.description.trim(),
      startDate: new Date(this.startDate).toISOString(),
      endDate: new Date(this.endDate).toISOString(),
      locationLat: this.locationLat ?? 0,
      locationLng: this.locationLng ?? 0,
      locationAddress: this.locationAddress || undefined,
      locationCity: this.locationCity ?? undefined,
      locationCountry: this.locationCountry ?? undefined,
      isSwipeJob: true,
      services: this.services,
      estimatedHours: this.estimatedHours ?? undefined,
      behaviorNotes: this.behaviorNotes.trim() || undefined,
      friendliness: (this.friendliness as any) || undefined,
      paymentMethodList: this.isVolunteer ? [] : this.paymentMethods,
      currency: this.currency,
      paymentAmount: this.isVolunteer ? 0 : (this.paymentAmount ?? 0),
      minPayment: this.isVolunteer ? undefined : (this.minPayment ?? undefined),
      maxPayment: this.isVolunteer ? undefined : (this.maxPayment ?? undefined),
      paymentRateType: (this.paymentRateType as any) || undefined,
      petIds,
      plantIds,
      strayAnimalIds,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/swipe']);
      },
      error: (err) => {
        this.saving.set(false);
        this.saveError.set(err?.error?.error || 'Failed to create job.');
      },
    });
  }

  protected goBack(): void { this.router.navigate(['/swipe']); }
}
