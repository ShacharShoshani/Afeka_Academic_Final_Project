import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HomeDataService } from './home-data.service';
import { PetsTab } from './tabs/pets-tab/pets-tab';
import { PlantsTab } from './tabs/plants-tab/plants-tab';
import { StrayTab } from './tabs/stray-tab/stray-tab';
import { formatDate, formatJoinDate, formatLastUpdated, formatCareType, formatAvailability } from '../../shared/utils/format';

type Tab = 'profile' | 'pets' | 'plants' | 'stray';

@Component({
  selector: 'app-home',
  imports: [PetsTab, PlantsTab, StrayTab],
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
}
