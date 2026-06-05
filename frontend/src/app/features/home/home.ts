import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import type { CareType, Availability } from '@livin/common';
import { AuthService } from '../../services/auth.service';
import { HomeDataService } from './home-data.service';
import { PetsTab } from './tabs/pets-tab/pets-tab';
import { PlantsTab } from './tabs/plants-tab/plants-tab';
import { StrayTab } from './tabs/stray-tab/stray-tab';
import { formatDate, formatJoinDate, formatLastUpdated, formatCareType, formatAvailability } from '../../shared/utils/format';

type Tab = 'profile' | 'pets' | 'plants' | 'stray';

const ALL_CARE_TYPES: CareType[] = ['dogs', 'cats', 'birds', 'fish', 'rabbits', 'hamsters', 'reptiles', 'plants', 'stray_animals'];
const ALL_AVAILABILITY: Availability[] = ['mornings', 'afternoons', 'evenings', 'weekends'];

@Component({
  selector: 'app-home',
  imports: [PetsTab, PlantsTab, StrayTab, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
  providers: [HomeDataService],
})
export class Home {
  private readonly router = inject(Router);
  protected readonly authService = inject(AuthService);
  protected readonly homeDataService = inject(HomeDataService);

  protected readonly user = this.authService.user;
  protected readonly isOwner = computed(() => this.user()?.role === 'owner');
  protected readonly activeTab = signal<Tab>('profile');

  protected readonly editing = signal(false);
  protected readonly saving = signal(false);
  protected readonly saveError = signal('');

  protected readonly allCareTypes = ALL_CARE_TYPES;
  protected readonly allAvailability = ALL_AVAILABILITY;

  // Mutable draft object — populated from current user on startEdit().
  protected draft = {
    name: '',
    bio: '',
    phone: '',
    residence: '',
    dateOfBirth: '',
    careTypes: [] as CareType[],
    availability: [] as Availability[],
    profilePhoto: '',
    lat: null as number | null,
    lng: null as number | null,
    city: null as string | null,
    country: null as string | null,
  };

  protected readonly formatDate = formatDate;
  protected readonly formatJoinDate = formatJoinDate;
  protected readonly formatLastUpdated = formatLastUpdated;
  protected readonly formatCareType = formatCareType;
  protected readonly formatAvailability = formatAvailability;

  constructor() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
    } else {
      this.loadData();
    }
  }

  private loadData(): void {
    this.homeDataService.loadPets();
    this.homeDataService.loadPlants();
    this.homeDataService.loadStrayAnimals();
  }

  protected setTab(tab: Tab): void {
    this.activeTab.set(tab);
  }

  protected getRoleLabel(role: string | undefined): string {
    if (role === 'owner') return 'Pet Owner';
    if (role === 'caretaker') return 'Caretaker';
    if (role === 'admin') return 'Admin';
    return '';
  }

  // --- Edit mode ---

  protected startEdit(): void {
    const u = this.user();
    if (!u) return;
    this.draft = {
      name: u.name,
      bio: u.bio ?? '',
      phone: u.phone ?? '',
      residence: u.residence ?? '',
      dateOfBirth: u.dateOfBirth ?? '',
      careTypes: [...u.careTypes],
      availability: [...u.availability],
      profilePhoto: u.profilePhoto ?? '',
      lat: u.lat ?? null,
      lng: u.lng ?? null,
      city: u.city ?? null,
      country: u.country ?? null,
    };
    this.saveError.set('');
    this.editing.set(true);
  }

  protected cancelEdit(): void {
    this.editing.set(false);
  }

  protected saveEdit(): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.saveError.set('');
    this.authService.updateProfile({
      name: this.draft.name.trim(),
      bio: this.draft.bio.trim(),
      phone: this.draft.phone.trim(),
      residence: this.draft.residence.trim(),
      dateOfBirth: this.draft.dateOfBirth,
      careTypes: this.draft.careTypes,
      availability: this.draft.availability,
      profilePhoto: this.draft.profilePhoto,
      lat: this.draft.lat,
      lng: this.draft.lng,
      city: this.draft.city,
      country: this.draft.country,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.editing.set(false);
      },
      error: (err) => {
        this.saving.set(false);
        this.saveError.set(err?.error?.error || 'Failed to save profile');
      },
    });
  }

  protected onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      this.saveError.set('Image must be under 5 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { this.draft.profilePhoto = reader.result as string; };
    reader.readAsDataURL(file);
  }

  protected toggleCareType(t: CareType): void {
    const i = this.draft.careTypes.indexOf(t);
    if (i >= 0) this.draft.careTypes.splice(i, 1);
    else this.draft.careTypes.push(t);
  }

  protected toggleAvailability(a: Availability): void {
    const i = this.draft.availability.indexOf(a);
    if (i >= 0) this.draft.availability.splice(i, 1);
    else this.draft.availability.push(a);
  }

  // When the user manually edits the residence text, the old coordinates no longer match.
  protected onResidenceChange(value: string): void {
    this.draft.residence = value;
    this.draft.lat = null;
    this.draft.lng = null;
    this.draft.city = null;
    this.draft.country = null;
  }

  protected draftHasCareType(t: CareType): boolean {
    return this.draft.careTypes.includes(t);
  }

  protected draftHasAvailability(a: Availability): boolean {
    return this.draft.availability.includes(a);
  }
}
