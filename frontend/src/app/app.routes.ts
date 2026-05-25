import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

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
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'browse',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/browse/browse').then((m) => m.Browse),
  },
  {
    path: 'users/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/user-profile/user-profile').then((m) => m.UserProfile),
  },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
];
