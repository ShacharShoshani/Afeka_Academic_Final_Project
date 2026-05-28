import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment.local';

// Google's official auth-failure hook — set BEFORE the script tag is appended.
// Google calls this asynchronously (via XHR) after the script loads, when the API key
// is invalid, billing is disabled, or the domain is not whitelisted.
// We dispatch a custom event so components that have already initialised can react.
(window as any).gm_authFailure = () => {
  (window as any).__mapsAuthFailed = true;
  window.dispatchEvent(new CustomEvent('gm-auth-failure'));
};

// Load Google Maps script dynamically.
// IMPORTANT: Angular must bootstrap regardless of whether Maps loads.
function loadGoogleMapsScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById('google-maps-script')) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      (window as any).__mapsAuthFailed = true;
      reject(new Error('Failed to load Google Maps API'));
    };
    document.head.appendChild(script);
  });
}

// Always bootstrap Angular — Maps load failure must not prevent the app from starting.
loadGoogleMapsScript()
  .catch(() => { /* Maps unavailable; components will fall back gracefully */ })
  .then(() => bootstrapApplication(App, appConfig).catch(console.error));
