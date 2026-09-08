import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { Role } from './core/models/auth.model';

export const routes: Routes = [
  { path: '', redirectTo: 'shipments', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [authGuard, roleGuard(Role.SUPERVISOR)],
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'shipments',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/shipments/shipment-list/shipment-list.component').then(
        (m) => m.ShipmentListComponent,
      ),
  },
  {
    path: 'shipments/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/shipments/shipment-detail/shipment-detail.component').then(
        (m) => m.ShipmentDetailComponent,
      ),
  },
  {
    path: 'tracking',
    loadComponent: () =>
      import('./features/tracking/public-tracking/public-tracking.component').then(
        (m) => m.PublicTrackingComponent,
      ),
  },
  {
    path: 'tracking/:trackingCode',
    loadComponent: () =>
      import('./features/tracking/public-tracking/public-tracking.component').then(
        (m) => m.PublicTrackingComponent,
      ),
  },
];
