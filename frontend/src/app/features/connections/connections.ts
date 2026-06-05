import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { UserConnection } from '@livin/common';
import { ConnectionsService } from '../../services/connections.service';

@Component({
  selector: 'app-connections',
  imports: [],
  templateUrl: './connections.html',
  styleUrl: './connections.css',
})
export class Connections implements OnInit {
  private readonly router = inject(Router);
  private readonly connectionsService = inject(ConnectionsService);

  protected readonly active = signal<UserConnection[]>([]);
  protected readonly cancelled = signal<UserConnection[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly showCancelled = signal(false);

  ngOnInit(): void {
    let done = 0;
    const finish = () => { if (++done === 2) this.loading.set(false); };

    this.connectionsService.list('active').subscribe({
      next: (list) => { this.active.set(list); finish(); },
      error: () => { this.error.set('Failed to load chats'); finish(); },
    });

    this.connectionsService.list('cancelled').subscribe({
      next: (list) => { this.cancelled.set(list); finish(); },
      error: () => finish(),
    });
  }

  protected openChat(id: string): void {
    this.router.navigate(['/connections', id]);
  }

  protected toggleCancelled(): void {
    this.showCancelled.update((v) => !v);
  }

  protected lastMessage(conn: UserConnection): string {
    const msgs = conn.messages;
    if (!msgs || msgs.length === 0) return 'No messages yet';
    return msgs[msgs.length - 1].content;
  }

  protected formatTime(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}
