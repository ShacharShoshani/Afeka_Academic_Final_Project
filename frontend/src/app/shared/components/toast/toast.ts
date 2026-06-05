import { Component, Input, OnChanges, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { NewMatchEvent } from '../../../services/socket.service';

@Component({
  selector: 'app-toast',
  imports: [],
  templateUrl: './toast.html',
  styleUrl: './toast.css',
})
export class Toast implements OnChanges {
  @Input() match: NewMatchEvent | null = null;

  private readonly router = inject(Router);
  protected readonly visible = signal(false);

  private dismissTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnChanges(): void {
    if (this.match) {
      this.visible.set(true);
      if (this.dismissTimer) clearTimeout(this.dismissTimer);
      this.dismissTimer = setTimeout(() => this.visible.set(false), 5000);
    }
  }

  protected goToChats(): void {
    this.visible.set(false);
    this.router.navigate(['/connections']);
  }

  protected dismiss(): void {
    this.visible.set(false);
  }
}
