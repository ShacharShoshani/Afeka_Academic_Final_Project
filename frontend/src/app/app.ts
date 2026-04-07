import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GoogleMapsModule } from '@angular/google-maps';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GoogleMapsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('livin_frontend');

  center: google.maps.LatLngLiteral = { lat: 32.0853, lng: 34.7818 };
  zoom = 12;
}
