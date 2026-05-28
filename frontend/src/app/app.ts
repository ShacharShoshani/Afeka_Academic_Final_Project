import { Component, inject } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { GoogleMapsModule } from '@angular/google-maps';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { Navbar } from './shared/components/navbar/navbar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GoogleMapsModule, Navbar],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private router = inject(Router);

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: '' },
  );

  protected showNavbar = () => {
    const url = this.currentUrl();
    return !url.startsWith('/register') && !url.startsWith('/login') && url !== '';
  };

  protected showMap = () => {
    const url = this.currentUrl();
    // /jobs manages its own map; /register has no map at all
    return url !== '' && !url.startsWith('/register') && !url.startsWith('/jobs') && !url.startsWith('/login');
  };

  center: google.maps.LatLngLiteral = { lat: 32.0853, lng: 34.7818 };
  zoom = 12;
}
