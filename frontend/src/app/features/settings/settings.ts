import { Component, computed, inject } from '@angular/core';
import type { DisplayMode } from '@livin/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-settings',
  imports: [],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {
  protected readonly authService = inject(AuthService);

  protected readonly currentMode = computed(() => this.authService.user()?.displayMode ?? 'social');

  protected selectMode(mode: DisplayMode): void {
    if (this.currentMode() === mode) return;
    this.authService.updateDisplayMode(mode).subscribe();
  }

}
