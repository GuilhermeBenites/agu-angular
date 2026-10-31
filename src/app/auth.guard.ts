import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { AuthFacade } from './core/auth/auth.facade';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthFacade);
  const router = inject(Router);
  return auth.state$.pipe(
    filter((state) => state.status !== 'checking'),
    take(1),
    map((state) =>
      state.status === 'authenticated'
        ? true
        : router.createUrlTree([state.status === 'unavailable' ? '/session' : '/login']),
    ),
  );
};
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthFacade);
  const router = inject(Router);
  return auth.state$.pipe(
    filter((state) => state.status !== 'checking'),
    take(1),
    map((state) =>
      state.status === 'authenticated'
        ? router.createUrlTree(['/tasks'])
        : state.status === 'unavailable'
          ? router.createUrlTree(['/session'])
          : true,
    ),
  );
};
