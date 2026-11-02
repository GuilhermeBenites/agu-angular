import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { catchError, throwError } from 'rxjs';
import { API_CONFIG } from '../config/api-config';
import { AuthActions } from './auth.state';
import { TokenStorage } from './token-storage.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const config = inject(API_CONFIG);
  const tokens = inject(TokenStorage);
  const store = inject(Store);
  const url = new URL(request.url, document.baseURI);
  const base = new URL(config.apiBaseUrl);
  const publicPaths = new Set([
    `${base.pathname}/login`,
    `${base.pathname}/register`,
    `${base.pathname}/health`,
  ]);
  const protectedApi =
    url.origin === base.origin &&
    (url.pathname === base.pathname || url.pathname.startsWith(`${base.pathname}/`)) &&
    !publicPaths.has(url.pathname);
  const token = protectedApi ? tokens.read() : null;
  const outgoing = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;
  return next(outgoing).pipe(
    catchError((error: unknown) => {
      if (
        protectedApi &&
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        tokens.read() === token
      )
        store.dispatch(AuthActions.sessionExpired());
      return throwError(() => error);
    }),
  );
};
