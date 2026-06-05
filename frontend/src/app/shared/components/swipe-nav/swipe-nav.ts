import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-swipe-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './swipe-nav.html',
  styleUrl: './swipe-nav.css',
})
export class SwipeNav {
  protected readonly notificationService = inject(NotificationService);
}
