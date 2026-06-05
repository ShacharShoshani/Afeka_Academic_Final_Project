import { Component, DestroyRef, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { filter } from 'rxjs';
import type { ConnectionMessage, UserConnection } from '@livin/common';
import { AuthService } from '../../services/auth.service';
import { ConnectionsService } from '../../services/connections.service';
import { SocketService } from '../../services/socket.service';

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
  private readonly socketService = inject(SocketService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly connection = signal<UserConnection | null>(null);
  protected readonly messages = signal<ConnectionMessage[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly draft = signal('');
  protected readonly imagePreview = signal<string | null>(null);
  protected readonly showEmojiPicker = signal(false);
  protected readonly confirming = signal(false);
  protected readonly declining = signal(false);
  protected readonly showDeclineConfirm = signal(false);

  // Emoji picker — curated sets of common emojis by category.
  protected readonly emojiCategories = [
    { label: 'Smileys', emojis: ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓'] },
    { label: 'Gestures', emojis: ['👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','🫶','👐','🤲','🙏','✍️','💅','🤳','💪','🦾','🦵','🦿','🦶','👂','🦻','👃','🫀','🫁','🧠','🦷','🦴','👀','👁️','👅','👄'] },
    { label: 'Hearts', emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','❤️‍🔥','❤️‍🩹','💔','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☯️','🫀','💋','💌','💒','💑','👫','👬','👭'] },
    { label: 'Animals', emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐒','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🪲','🦟','🦗','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐟','🐬','🐳'] },
    { label: 'Plants', emojis: ['🌵','🌲','🌳','🌴','🌱','🌿','☘️','🍀','🎋','🍃','🍂','🍁','🍄','🌾','💐','🌷','🌹','🥀','🌺','🌸','🌼','🌻','🌞','🌝','🌛','🌜','🌚','🌕','🌖','🌗','🌘','🌑','🌒','🌓','🌔'] },
    { label: 'Fun', emojis: ['🎉','🎊','🎈','🎁','🏆','🥇','🥈','🥉','⭐','🌟','✨','🔥','💫','🎯','🎮','🎲','🃏','🎨','🎭','🎬','🎤','🎵','🎶','🎸','🎹','🥁','🎺','🎻','🎷','🥂','🍾','☕','🍕','🍔','🌮','🍜','🍣','🍦','🍰','🎂'] },
  ];

  protected readonly canSend = () =>
    !this.isCancelled() && (this.draft().trim().length > 0 || !!this.imagePreview());
  protected readonly callerId = this.authService.user()?.id ?? '';

  // ── Derived state ──────────────────────────────────────────────────────────

  protected readonly isCancelled = computed(() => !!this.connection()?.cancelledAt);
  protected readonly isConfirmed = computed(() => !!this.connection()?.confirmedAt);

  protected readonly myConfirmed = computed(() => {
    const c = this.connection();
    if (!c) return false;
    return c.user1Id === this.callerId ? c.user1Confirmed : c.user2Confirmed;
  });

  protected readonly theirConfirmed = computed(() => {
    const c = this.connection();
    if (!c) return false;
    return c.user1Id === this.callerId ? c.user2Confirmed : c.user1Confirmed;
  });

  protected readonly otherName = computed(
    () => this.connection()?.otherUser?.name ?? 'them',
  );

  protected readonly cancelledByMe = computed(() => {
    const c = this.connection();
    return !!c?.cancelledAt && c.cancelledById === this.callerId;
  });


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

    // Real-time: new message from the other participant.
    this.socketService.newMessage$
      .pipe(
        filter((e) => e.connectionId === this.connectionId),
        filter((e) => e.message.senderId !== this.callerId),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((e) => {
        this.messages.update((list) => [...list, e.message]);
        setTimeout(() => this.scrollToBottom(), 0);
      });

    // Real-time: confirm or decline by either participant.
    this.socketService.connectionUpdated$
      .pipe(
        filter((c) => c.id === this.connectionId),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((updated) => {
        this.connection.update((prev) =>
          prev ? { ...updated, messages: prev.messages } : updated,
        );
      });
  }

  protected toggleEmojiPicker(): void {
    this.showEmojiPicker.update((v) => !v);
  }

  protected insertEmoji(emoji: string): void {
    this.draft.update((d) => d + emoji);
    this.showEmojiPicker.set(false);
  }

  protected onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => { this.imagePreview.set(reader.result as string); };
    reader.readAsDataURL(file);
  }

  protected removeImage(): void {
    this.imagePreview.set(null);
  }

  protected send(): void {
    const content = this.draft().trim();
    const image = this.imagePreview();
    if ((!content && !image) || this.isCancelled()) return;
    this.draft.set('');
    this.imagePreview.set(null);
    this.showEmojiPicker.set(false);

    this.connectionsService.sendMessage(this.connectionId, content, image).subscribe({
      next: (msg) => {
        this.messages.update((list) => [...list, msg]);
        setTimeout(() => this.scrollToBottom(), 0);
      },
    });
  }

  protected confirmJob(): void {
    if (this.myConfirmed() || this.isConfirmed() || this.confirming()) return;
    this.confirming.set(true);
    this.connectionsService.confirm(this.connectionId).subscribe({
      next: (updated) => {
        this.connection.update((c) => (c ? { ...c, ...updated, messages: c.messages } : updated));
        this.confirming.set(false);
      },
      error: () => this.confirming.set(false),
    });
  }

  protected requestDecline(): void {
    this.showDeclineConfirm.set(true);
  }

  protected cancelDeclineDialog(): void {
    this.showDeclineConfirm.set(false);
  }

  protected confirmDecline(): void {
    this.showDeclineConfirm.set(false);
    this.declining.set(true);
    this.connectionsService.decline(this.connectionId).subscribe({
      next: (updated) => {
        this.connection.update((c) => (c ? { ...c, ...updated, messages: c.messages } : updated));
        this.declining.set(false);
      },
      error: () => this.declining.set(false),
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
