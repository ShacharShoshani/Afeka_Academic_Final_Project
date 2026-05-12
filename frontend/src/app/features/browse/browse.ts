import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { PublicUser, UserRole } from '@livin/common';
import { AuthService } from '../../services/auth.service';
import { UsersService } from '../../services/users.service';

type RoleFilter = 'all' | 'owner' | 'caretaker';

@Component({
  selector: 'app-browse',
  imports: [],
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
  protected readonly filter = signal<RoleFilter>('all');

  ngOnInit(): void {
    this.load();
  }

  protected setFilter(next: RoleFilter): void {
    if (this.filter() === next) return;
    this.filter.set(next);
    this.load();
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
    const role = this.filter();
    const apiRole = role === 'all' ? undefined : role;
    this.usersService.list(apiRole).subscribe({
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
