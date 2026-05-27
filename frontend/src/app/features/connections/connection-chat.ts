import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import type { ConnectionMessage, UserConnection } from '@livin/common';
import { AuthService } from '../../services/auth.service';
import { ConnectionsService } from '../../services/connections.service';

@Component({
  selector: 'app-connection-chat',
  imports: [FormsModule],
  templateUrl: './connection-chat.html',
  styleUrl: './connection-chat.css',
})
export class ConnectionChat implements OnInit {
  @ViewChild('messageList') private messageListRef?: ElementRef<HTMLElement>;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly connectionsService = inject(ConnectionsService);

  protected readonly connection = signal<UserConnection | null>(null);
  protected readonly messages = signal<ConnectionMessage[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly draft = signal('');
  protected readonly callerId = this.authService.user()?.id ?? '';

  private connectionId = '';

  ngOnInit(): void {
    this.connectionId = this.route.snapshot.paramMap.get('id') ?? '';
    this.connectionsService.getById(this.connectionId).subscribe({
      next: (conn) => {
        this.connection.set(conn);
        this.messages.set(conn.messages ?? []);
        this.loading.set(false);
        setTimeout(() => this.scrollToBottom(), 0);
      },
      error: () => {
        this.error.set('Failed to load chat');
        this.loading.set(false);
      },
    });
  }

  protected send(): void {
    const content = this.draft().trim();
    if (!content) return;
    this.draft.set('');

    this.connectionsService.sendMessage(this.connectionId, content).subscribe({
      next: (msg) => {
        this.messages.update((list) => [...list, msg]);
        setTimeout(() => this.scrollToBottom(), 0);
      },
    });
  }

  protected goBack(): void {
    this.router.navigate(['/connections']);
  }

  protected isOwn(msg: ConnectionMessage): boolean {
    return msg.senderId === this.callerId;
  }

  protected formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private scrollToBottom(): void {
    const el = this.messageListRef?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}
