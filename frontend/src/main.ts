import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment.local';

// Load Google Maps script dynamically
function loadGoogleMapsScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById('google-maps-script')) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps API'));
    document.head.appendChild(script);
  });
}

loadGoogleMapsScript()
  .then(() => {
    bootstrapApplication(App, appConfig)
      .catch((err) => console.error(err));
  })
  .catch((err) => console.error('Error loading Google Maps:', err));
