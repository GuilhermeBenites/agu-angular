import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { catchError, exhaustMap, map, of, startWith, takeUntil, tap } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { AuthCommands } from './auth.commands';
import { AuthActions } from './auth.state';
import { TokenStorage, tokenExpiresAt } from './token-storage.service';
import { SessionExpiry } from './session-expiry.service';
import { apiFailure } from './api-failure';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable()
export class AuthEffects {
  private readonly cancelled$ = this.actions$.pipe(
    ofType(AuthActions.logout, AuthActions.sessionExpired),
  );
  readonly login$ = createEffect(() =>
    this.commands.login$.pipe(
      exhaustMap((credentials) =>
        this.api.login(credentials.username, credentials.password).pipe(
          tap((response) => {
            this.tokens.write(response.token);
            this.expiry.schedule(response.token);
          }),
          map((response) => AuthActions.loginSucceeded({ user: response.user })),
          catchError((error: unknown) => of(AuthActions.loginFailed({ error: apiFailure(error) }))),
          takeUntil(this.cancelled$),
          startWith(AuthActions.loginStarted()),
        ),
      ),
    ),
  );
  readonly register$ = createEffect(() =>
    this.commands.register$.pipe(
      exhaustMap((credentials) =>
        this.api.register(credentials.username, credentials.password).pipe(
          map(() => AuthActions.registrationSucceeded()),
          catchError((error: unknown) =>
            of(AuthActions.registrationFailed({ error: apiFailure(error) })),
          ),
          startWith(AuthActions.registrationStarted()),
        ),
      ),
    ),
  );
  readonly restore$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.restoreRequested),
      exhaustMap(() => {
        const token = this.tokens.read();
        if (!token || (tokenExpiresAt(token) ?? 0) <= Date.now()) {
          this.tokens.clear();
          return of(AuthActions.sessionAnonymous());
        }
        this.expiry.schedule(token);
        return this.api.me().pipe(
          map((user) => AuthActions.sessionRestored({ user })),
          catchError((error: unknown) => {
            if (error instanceof HttpErrorResponse && error.status === 401) {
              this.tokens.clear();
              return of(AuthActions.sessionAnonymous());
            }
            return of(AuthActions.sessionUnavailable({ error: apiFailure(error) }));
          }),
          takeUntil(this.cancelled$),
        );
      }),
    ),
  );
  readonly anonymousCleanup$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.sessionAnonymous),
        tap(() => {
          this.tokens.clear();
          this.expiry.cancel();
          if (this.router.url.startsWith('/session')) void this.router.navigate(['/login']);
        }),
      ),
    { dispatch: false },
  );
  readonly expire$ = createEffect(() =>
    this.expiry.expired$.pipe(map(() => AuthActions.sessionExpired())),
  );
  readonly cleanup$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logout, AuthActions.sessionExpired),
        tap((action) => {
          this.tokens.clear();
          this.expiry.cancel();
          void this.router.navigate(['/login'], {
            queryParams:
              action.type === AuthActions.sessionExpired.type ? { reason: 'expired' } : {},
          });
        }),
      ),
    { dispatch: false },
  );
  readonly loginNavigation$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSucceeded),
        tap(() => {
          void this.router.navigate(['/tasks']);
        }),
      ),
    { dispatch: false },
  );
  readonly registeredNavigation$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.registrationSucceeded),
        tap(() => {
          void this.router.navigate(['/login'], { queryParams: { registered: '1' } });
        }),
      ),
    { dispatch: false },
  );
  readonly restoredNavigation$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.sessionRestored),
        tap(() => {
          if (this.router.url.startsWith('/session')) void this.router.navigate(['/tasks']);
        }),
      ),
    { dispatch: false },
  );
  constructor(
    private readonly actions$: Actions,
    private readonly commands: AuthCommands,
    private readonly api: AuthService,
    private readonly tokens: TokenStorage,
    private readonly expiry: SessionExpiry,
    private readonly router: Router,
  ) {}
}
