import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { filter, take } from 'rxjs';
import { AuthCommands } from './auth.commands';
import { Credentials } from './auth.models';
import { AuthActions, authFeature } from './auth.state';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  readonly state$ = this.store.select(authFeature.selectAuthState);
  constructor(
    private readonly store: Store,
    private readonly commands: AuthCommands,
  ) {}
  initialize() {
    this.restore();
    return this.state$.pipe(
      filter((state) => state.status !== 'checking'),
      take(1),
    );
  }
  restore(): void {
    this.store.dispatch(AuthActions.restoreRequested());
  }
  login(credentials: Credentials): void {
    this.commands.login(credentials);
  }
  register(credentials: Credentials): void {
    this.commands.register(credentials);
  }
  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
  clearErrors(): void {
    this.store.dispatch(AuthActions.clearFormErrors());
  }
}
