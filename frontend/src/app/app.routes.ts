import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'register',
    loadComponent: () =>
      import('./features/registration/registration-step1').then(
        (m) => m.RegistrationStep1,
      ),
  },
  {
    path: 'register/step-2',
    loadComponent: () =>
      import('./features/registration/registration-step2').then(
        (m) => m.RegistrationStep2,
      ),
  },
  {
    path: 'register/step-3',
    loadComponent: () =>
      import('./features/registration/registration-step3').then(
        (m) => m.RegistrationStep3,
      ),
  },
  {
    path: 'register/step-4',
    loadComponent: () =>
      import('./features/registration/registration-step4').then(
        (m) => m.RegistrationStep4,
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login').then((m) => m.Login),
  },
  { path: '', redirectTo: 'register', pathMatch: 'full' },
];
