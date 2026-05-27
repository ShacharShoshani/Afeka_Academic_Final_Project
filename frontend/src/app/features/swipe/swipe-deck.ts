import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import type { PublicUser } from '@livin/common';
import { SwipeService } from '../../services/swipe.service';

@Component({
  selector: 'app-swipe-deck',
  imports: [],
  templateUrl: './swipe-deck.html',
  styleUrl: './swipe-deck.css',
})
export class SwipeDeck implements OnInit {
  private readonly swipeService = inject(SwipeService);
  private readonly router = inject(Router);

  protected readonly deck = signal<PublicUser[]>([]);
  protected readonly currentIndex = signal(0);
  protected readonly dragging = signal(false);
  protected readonly dragDeltaX = signal(0);
  protected readonly matched = signal<{ connectionId: string; name: string } | null>(null);
  protected readonly empty = signal(false);

  private startX = 0;
  private pointerId = -1;

  protected readonly currentCard = computed(() => this.deck()[this.currentIndex()] ?? null);
  protected readonly nextCard = computed(() => this.deck()[this.currentIndex() + 1] ?? null);

  protected readonly likeOpacity = computed(() =>
    Math.min(1, Math.max(0, this.dragDeltaX() / 100)),
  );
  protected readonly passOpacity = computed(() =>
    Math.min(1, Math.max(0, -this.dragDeltaX() / 100)),
  );

  protected readonly cardTransform = computed(() => {
    const dx = this.dragDeltaX();
    if (!this.dragging() || dx === 0) return '';
    const rotate = dx * 0.1;
    return `translateX(${dx}px) rotate(${rotate}deg)`;
  });

  ngOnInit(): void {
    this.fetchDeck();
  }

  private fetchDeck(): void {
    this.swipeService.getDeck().subscribe({
      next: (users) => {
        if (users.length === 0) {
          this.empty.set(true);
        } else {
          this.deck.update((existing) => [...existing, ...users]);
        }
      },
    });
  }

  protected onPointerDown(e: PointerEvent): void {
    if (this.pointerId !== -1) return;
    this.pointerId = e.pointerId;
    this.startX = e.clientX;
    this.dragging.set(true);
    this.dragDeltaX.set(0);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  protected onPointerMove(e: PointerEvent): void {
    if (e.pointerId !== this.pointerId) return;
    this.dragDeltaX.set(e.clientX - this.startX);
  }

  protected onPointerUp(e: PointerEvent): void {
    if (e.pointerId !== this.pointerId) return;
    this.pointerId = -1;
    const delta = this.dragDeltaX();
    this.dragging.set(false);
    this.dragDeltaX.set(0);

    if (Math.abs(delta) >= 100) {
      this.commitSwipe(delta > 0);
    }
  }

  private commitSwipe(liked: boolean): void {
    const card = this.currentCard();
    if (!card) return;

    this.currentIndex.update((i) => i + 1);

    const remaining = this.deck().length - this.currentIndex();
    if (remaining < 3) {
      this.fetchDeck();
    }

    if (this.currentIndex() >= this.deck().length) {
      this.empty.set(true);
    }

    this.swipeService.swipe(card.id, liked).subscribe({
      next: (res) => {
        if (res.matched && res.connectionId) {
          this.matched.set({ connectionId: res.connectionId, name: card.name });
        }
      },
    });
  }

  protected swipeLeft(): void {
    this.commitSwipe(false);
  }

  protected swipeRight(): void {
    this.commitSwipe(true);
  }

  protected dismissMatch(): void {
    this.matched.set(null);
  }

  protected openChat(): void {
    const m = this.matched();
    if (m) {
      this.matched.set(null);
      this.router.navigate(['/connections', m.connectionId]);
    }
  }

  protected formatCareType(type: string): string {
    return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
  }
}
