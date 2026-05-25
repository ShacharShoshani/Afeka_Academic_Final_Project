import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';
import type { Availability, CareType, PublicUser, UserRole } from '@livin/common';
import { AuthService } from '../../services/auth.service';
import { UsersService } from '../../services/users.service';

type RoleFilter = 'all' | 'owner' | 'caretaker';

const ALL_CARE_TYPES: CareType[] = ['dogs', 'cats', 'birds', 'fish', 'rabbits', 'hamsters', 'reptiles', 'plants', 'stray_animals'];
const ALL_AVAILABILITY: Availability[] = ['mornings', 'afternoons', 'evenings', 'weekends'];

@Component({
  selector: 'app-browse',
  imports: [RouterLink, FormsModule],
  templateUrl: './browse.html',
  styleUrl: './browse.css',
})
export class Browse implements OnInit {
  private readonly router = inject(Router);
  private readonly usersService = inject(UsersService);
  protected readonly authService = inject(AuthService);

  protected readonly users = signal<PublicUser[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string>('');

  protected readonly roleFilter = signal<RoleFilter>('all');
  protected readonly careTypes = signal<CareType[]>([]);
  protected readonly availability = signal<Availability[]>([]);
  protected readonly residence = signal<string>('');
  protected readonly filtersOpen = signal(false);

  protected readonly allCareTypes = ALL_CARE_TYPES;
  protected readonly allAvailability = ALL_AVAILABILITY;

  // Hide availability when the user explicitly wants only owners.
  protected readonly showAvailabilityFilter = computed(() => this.roleFilter() !== 'owner');

  protected readonly activeFilterCount = computed(
    () =>
      this.careTypes().length +
      this.availability().length +
      (this.residence().trim() ? 1 : 0),
  );

  private readonly residenceInput$ = new Subject<string>();

  ngOnInit(): void {
    this.residenceInput$.pipe(debounceTime(300)).subscribe((value) => {
      this.residence.set(value);
      this.load();
    });
    this.load();
  }

  protected setRoleFilter(next: RoleFilter): void {
    if (this.roleFilter() === next) return;
    this.roleFilter.set(next);
    // If we narrow to owners, an availability filter is meaningless — clear it.
    if (next === 'owner' && this.availability().length) {
      this.availability.set([]);
    }
    this.load();
  }

  protected toggleCareType(type: CareType): void {
    const current = this.careTypes();
    this.careTypes.set(current.includes(type) ? current.filter((t) => t !== type) : [...current, type]);
    this.load();
  }

  protected toggleAvailability(slot: Availability): void {
    const current = this.availability();
    this.availability.set(current.includes(slot) ? current.filter((s) => s !== slot) : [...current, slot]);
    this.load();
  }

  protected onResidenceInput(value: string): void {
    this.residenceInput$.next(value);
  }

  protected clearFilters(): void {
    this.careTypes.set([]);
    this.availability.set([]);
    this.residence.set('');
    this.load();
  }

  protected toggleFiltersPanel(): void {
    this.filtersOpen.update((v) => !v);
  }

  protected goHome(): void {
    this.router.navigate(['/home']);
  }

  protected formatCareType(type: string): string {
    return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
  }

  protected formatAvailability(slot: string): string {
    return slot.charAt(0).toUpperCase() + slot.slice(1);
  }

  protected getRoleLabel(role: UserRole): string {
    if (role === 'owner') return 'Pet Owner';
    if (role === 'caretaker') return 'Caretaker';
    return 'Admin';
  }

  private load(): void {
    this.loading.set(true);
    this.error.set('');
    const role = this.roleFilter();
    this.usersService
      .list({
        role: role === 'all' ? undefined : role,
        careTypes: this.careTypes(),
        availability: this.showAvailabilityFilter() ? this.availability() : [],
        residence: this.residence(),
      })
      .subscribe({
        next: (list) => {
          this.users.set(list);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.error || 'Failed to load users');
          this.loading.set(false);
        },
      });
  }
}
