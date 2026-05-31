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

  protected readonly connections = signal<UserConnection[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  ngOnInit(): void {
    this.connectionsService.list().subscribe({
      next: (list) => {
        this.connections.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load connections');
        this.loading.set(false);
      },
    });
  }

  protected openChat(id: string): void {
    this.router.navigate(['/connections', id]);
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
