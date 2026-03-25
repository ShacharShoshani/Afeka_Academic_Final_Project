/**
 * Environment configuration for DEVELOPMENT
 * 
 * For local development with sensitive keys:
 * 1. Copy this file to environment.local.ts
 * 2. Add your actual API keys to environment.local.ts
 * 3. environment.local.ts is ignored by git (.gitignore)
 * 
 * The app will prefer environment.local.ts if it exists
 */
export const environment = {
  production: false,
  googleMapsApiKey: 'YOUR_GOOGLE_MAPS_API_KEY_HERE',
};
