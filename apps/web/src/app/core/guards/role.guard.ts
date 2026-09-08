import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../models/auth.model';

export const roleGuard = (requiredRole: Role): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.currentUser();
    if (user && user.role === requiredRole) {
      return true;
    }

    router.navigate(['/shipments']);
    return false;
  };
};
