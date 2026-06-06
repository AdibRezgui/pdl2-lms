import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const allowed: string[] = route.data['roles'] ?? [];
  if (auth.role() && allowed.includes(auth.role()!)) return true;
  return inject(Router).createUrlTree(['/login']);
};
