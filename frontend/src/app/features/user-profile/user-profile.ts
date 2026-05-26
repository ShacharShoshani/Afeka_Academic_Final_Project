import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import type { Pet, Plant, PublicUser, StrayAnimal, UserRole } from '@livin/common';
import { UsersService } from '../../services/users.service';
import {
  formatDate,
  formatJoinDate,
  formatLastUpdated,
  formatCareType,
  formatAvailability,
  formatAnimalType,
  formatSize,
} from '../../shared/utils/format';

@Component({
  selector: 'app-user-profile',
  imports: [],
  templateUrl: './user-profile.html',
  styleUrls: ['./user-profile.css', './user-profile-records.css'],
})
export class UserProfile implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly usersService = inject(UsersService);

  protected readonly profile = signal<PublicUser | null>(null);
  protected readonly pets = signal<Pet[]>([]);
  protected readonly plants = signal<Plant[]>([]);
  protected readonly strays = signal<StrayAnimal[]>([]);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly error = signal<string>('');

  protected readonly formatDate = formatDate;
  protected readonly formatJoinDate = formatJoinDate;
  protected readonly formatLastUpdated = formatLastUpdated;
  protected readonly formatCareType = formatCareType;
  protected readonly formatAvailability = formatAvailability;
  protected readonly formatAnimalType = formatAnimalType;
  protected readonly formatSize = formatSize;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }

    this.usersService.getById(id).subscribe({
      next: (u) => {
        this.profile.set(u);
        if (u.role === 'owner') {
          this.loadOwnerRecords(id);
        } else {
          this.loading.set(false);
        }
      },
      error: (err) => {
        if (err?.status === 404) {
          this.notFound.set(true);
        } else {
          this.error.set(err?.error?.error || 'Failed to load profile');
        }
        this.loading.set(false);
      },
    });
  }

  protected goBack(): void {
    this.router.navigate(['/browse']);
  }

  protected getRoleLabel(role: UserRole): string {
    if (role === 'owner') return 'Pet Owner';
    if (role === 'caretaker') return 'Caretaker';
    return 'Admin';
  }

  private loadOwnerRecords(id: string): void {
    forkJoin({
      pets: this.usersService.getPets(id).pipe(catchError(() => of([] as Pet[]))),
      plants: this.usersService.getPlants(id).pipe(catchError(() => of([] as Plant[]))),
      strays: this.usersService.getStrays(id).pipe(catchError(() => of([] as StrayAnimal[]))),
    }).subscribe({
      next: ({ pets, plants, strays }) => {
        this.pets.set(pets);
        this.plants.set(plants);
        this.strays.set(strays);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
