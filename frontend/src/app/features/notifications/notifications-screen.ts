import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { AppNotification } from '@livin/common';
import { NotificationService } from '../../services/notification.service';

const TYPE_LABELS: Record<string, string> = {
  new_match: '💚 New match',
  new_message: '💬 New message',
  job_confirmed: '✅ Job confirmed',
  job_declined: '❌ Match declined',
  review_request: '⭐ New review',
  admin_update: '🛡 Admin update',
};

@Component({
  selector: 'app-notifications-screen',
  imports: [],
  templateUrl: './notifications-screen.html',
  styleUrl: './notifications-screen.css',
})
export class NotificationsScreen implements OnInit {
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  protected readonly notifications = signal<AppNotification[]>([]);
  protected readonly loading = signal(true);
  protected readonly TYPE_LABELS = TYPE_LABELS;

  ngOnInit(): void {
    this.notificationService.fetchAll().subscribe({
      next: (r) => { this.notifications.set(r.notifications); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  protected markRead(n: AppNotification): void {
    if (n.isRead) return;
    this.notificationService.markRead(n.id).subscribe();
    this.notifications.update((list) => list.map((x) => x.id === n.id ? { ...x, isRead: true } : x));
    this.notificationService.unreadCount.update((c) => Math.max(0, c - 1));
  }

  protected markAllRead(): void {
    this.notificationService.markAllRead().subscribe();
    this.notifications.update((list) => list.map((n) => ({ ...n, isRead: true })));
  }

  protected navigate(n: AppNotification): void {
    this.markRead(n);
    const p = n.payload as Record<string, string>;
    if ((n.type === 'new_match' || n.type === 'new_message' || n.type === 'job_confirmed' || n.type === 'job_declined') && p['connectionId']) {
      this.router.navigate(['/connections', p['connectionId']]);
    } else if (n.type === 'review_request' && p['jobId']) {
      this.router.navigate(['/confirmed']);
    }
  }

  protected formatTime(iso: string): string {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    if (diff < 60_000) return 'Just now';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
  }

  protected goBack(): void { this.router.navigate([this.router.url.includes('swipe') ? '/settings' : '/home']); }
}
