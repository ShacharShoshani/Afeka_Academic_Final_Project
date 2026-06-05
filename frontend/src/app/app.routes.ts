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
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password').then((m) => m.ForgotPassword),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/auth/reset-password').then((m) => m.ResetPassword),
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
    path: 'swipe',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/swipe/swipe-deck').then((m) => m.SwipeDeck),
  },
  {
    path: 'swipe/create-job',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/swipe/create-swipe-job').then((m) => m.CreateSwipeJob),
  },
  {
    path: 'preferences',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/preferences/match-preferences').then((m) => m.MatchPreferences),
  },
  {
    path: 'jobs',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/jobs/jobs').then((m) => m.Jobs),
  },
  {
    path: 'users/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/user-profile/user-profile').then((m) => m.UserProfile),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/settings/settings').then((m) => m.Settings),
  },
  {
    path: 'connections',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/connections/connections').then((m) => m.Connections),
  },
  {
    path: 'connections/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/connections/connection-chat').then((m) => m.ConnectionChat),
  },
  {
    path: 'confirmed',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/connections/confirmed-jobs').then((m) => m.ConfirmedJobs),
  },
  {
    path: 'my-jobs',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/swipe/my-jobs').then((m) => m.MyJobs),
  },
  {
    path: 'notifications',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/notifications/notifications-screen').then((m) => m.NotificationsScreen),
  },
  {
    path: 'admin/reports',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/admin-reports').then((m) => m.AdminReports),
  },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
];
