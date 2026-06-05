import { Component, effect, inject, signal } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { GoogleMapsModule } from '@angular/google-maps';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { Navbar } from './shared/components/navbar/navbar';
import { SwipeNav } from './shared/components/swipe-nav/swipe-nav';
import { Toast } from './shared/components/toast/toast';
import { AuthService } from './services/auth.service';
import { SocketService, type NewMatchEvent } from './services/socket.service';
import { NotificationService } from './services/notification.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GoogleMapsModule, Navbar, SwipeNav, Toast],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private router = inject(Router);
  private authService = inject(AuthService);
  private socketService = inject(SocketService);
  protected readonly notificationService = inject(NotificationService);

  protected readonly matchToast = signal<NewMatchEvent | null>(null);

  constructor() {
    // Connect socket when the user is logged in; disconnect on logout.
    effect(() => {
      if (this.authService.user()) {
        this.socketService.connect();
        this.socketService.newMatch$.subscribe((event) => {
          this.matchToast.set(event);
        });
        this.socketService.newNotification$.subscribe(() => {
          this.notificationService.incrementUnread();
        });
        // Load initial unread count.
        this.notificationService.fetchAll().subscribe();
      } else {
        this.socketService.disconnect();
      }
    });
  }

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: '' },
  );

  // Swipe Mode replaces the top navbar/global map with a bottom tab bar.
  protected swipeMode = () => this.authService.user()?.displayMode === 'swipe';

  private onAuthPage = () => {
    const url = this.currentUrl();
    return url === '' || url.startsWith('/register') || url.startsWith('/login');
  };

  // Bottom nav shows only on the five top-level tabs; drill-in screens (chat,
  // preferences, profiles) are full-screen with their own back button.
  private readonly tabRoots = ['/settings', '/home', '/swipe', '/connections', '/my-jobs'];

  protected showSwipeNav = () => {
    if (this.onAuthPage() || !this.swipeMode()) return false;
    const path = this.currentUrl().split('?')[0];
    return this.tabRoots.includes(path);
  };

  protected showNavbar = () => !this.onAuthPage() && !this.swipeMode();

  protected showMap = () => {
    const url = this.currentUrl();
    // /jobs manages its own map; /register/login have none; Swipe Mode hides it entirely.
    return !this.onAuthPage() && !this.swipeMode() && !url.startsWith('/jobs');
  };

  center: google.maps.LatLngLiteral = { lat: 32.0853, lng: 34.7818 };
  zoom = 12;
}
