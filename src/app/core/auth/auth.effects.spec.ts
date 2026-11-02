import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Actions } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { AuthEffects } from './auth.effects';
import { AuthCommands } from './auth.commands';
import { AuthActions } from './auth.state';
import { AuthService } from '../../services/auth.service';
import { TokenStorage } from './token-storage.service';
import { SessionExpiry } from './session-expiry.service';
import { LoginResponse } from './auth.models';
function token(seconds = 3600) {
  return `e30.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + seconds }))}.signature`;
}
describe('Authentication effects', () => {
  let effects: AuthEffects;
  let commands: AuthCommands;
  let actions: Subject<Action>;
  let api: jasmine.SpyObj<AuthService>;
  let current: string | null;
  let write: jasmine.Spy;
  let clear: jasmine.Spy;
  let schedule: jasmine.Spy;
  beforeEach(() => {
    actions = new Subject<Action>();
    api = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'register', 'me']);
    current = null;
    write = jasmine.createSpy('write').and.callFake((value) => (current = value));
    clear = jasmine.createSpy('clear').and.callFake(() => (current = null));
    schedule = jasmine.createSpy('schedule');
    TestBed.configureTestingModule({
      providers: [
        AuthEffects,
        AuthCommands,
        { provide: Actions, useValue: actions },
        { provide: AuthService, useValue: api },
        { provide: TokenStorage, useValue: { read: () => current, write, clear } },
        {
          provide: SessionExpiry,
          useValue: {
            schedule,
            cancel: jasmine.createSpy('cancel'),
            expired$: new Subject<void>(),
          },
        },
        {
          provide: Router,
          useValue: { navigate: jasmine.createSpy('navigate').and.resolveTo(true), url: '/login' },
        },
      ],
    });
    effects = TestBed.inject(AuthEffects);
    commands = TestBed.inject(AuthCommands);
  });
  it('stores the token outside actions and ignores repeated pending submissions', () => {
    const pending = new Subject<LoginResponse>();
    api.login.and.returnValue(pending);
    const emitted: Action[] = [];
    effects.login$.subscribe((action) => emitted.push(action));
    commands.login({ username: 'ana', password: 'private-password' });
    commands.login({ username: 'ana', password: 'private-password' });
    expect(api.login).toHaveBeenCalledTimes(1);
    const response = {
      token: token(),
      tokenType: 'Bearer' as const,
      expiresIn: 3600,
      user: { id: 1, username: 'ana' },
    };
    pending.next(response);
    pending.complete();
    expect(write).toHaveBeenCalledWith(response.token);
    expect(emitted).toEqual([
      AuthActions.loginStarted(),
      AuthActions.loginSucceeded({ user: response.user }),
    ]);
    expect(JSON.stringify(emitted)).not.toContain('private-password');
    expect(JSON.stringify(emitted)).not.toContain(response.token);
  });
  it('cancels pending login on logout so a late response cannot restore it', () => {
    const pending = new Subject<LoginResponse>();
    api.login.and.returnValue(pending);
    const emitted: Action[] = [];
    effects.login$.subscribe((action) => emitted.push(action));
    commands.login({ username: 'ana', password: 'private-password' });
    actions.next(AuthActions.logout());
    pending.next({
      token: token(),
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: { id: 1, username: 'ana' },
    });
    expect(write).not.toHaveBeenCalled();
    expect(emitted).toEqual([AuthActions.loginStarted()]);
  });
  it('maps HTTP login failure without retaining the raw request', () => {
    api.login.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            error: { error: { code: 'invalid_credentials', message: 'Inválido', details: [] } },
          }),
      ),
    );
    const emitted: Action[] = [];
    effects.login$.subscribe((action) => emitted.push(action));
    commands.login({ username: 'ana', password: 'private-password' });
    expect(emitted[1]).toEqual(
      AuthActions.loginFailed({
        error: { code: 'invalid_credentials', message: 'Inválido', details: [] },
      }),
    );
    expect(JSON.stringify(emitted)).not.toContain('private-password');
  });
  it('restores the verified identity and schedules expiration', () => {
    current = token();
    api.me.and.returnValue(of({ id: 1, username: 'ana' }));
    const emitted: Action[] = [];
    effects.restore$.subscribe((action) => emitted.push(action));
    actions.next(AuthActions.restoreRequested());
    expect(emitted).toEqual([AuthActions.sessionRestored({ user: { id: 1, username: 'ana' } })]);
    expect(schedule).toHaveBeenCalledWith(current);
  });
  it('keeps the token on a transient restore failure', () => {
    current = token();
    api.me.and.returnValue(throwError(() => new HttpErrorResponse({ status: 503 })));
    const emitted: Action[] = [];
    effects.restore$.subscribe((action) => emitted.push(action));
    actions.next(AuthActions.restoreRequested());
    expect(emitted[0].type).toBe(AuthActions.sessionUnavailable.type);
    expect(clear).not.toHaveBeenCalled();
    expect(current).not.toBeNull();
  });
  it('clears an expired local token without requesting the API', () => {
    current = token(-10);
    const emitted: Action[] = [];
    effects.restore$.subscribe((action) => emitted.push(action));
    actions.next(AuthActions.restoreRequested());
    expect(emitted).toEqual([AuthActions.sessionAnonymous()]);
    expect(api.me).not.toHaveBeenCalled();
    expect(clear).toHaveBeenCalled();
  });
  it('clears a server-rejected token', () => {
    current = token();
    api.me.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
    effects.restore$.subscribe();
    actions.next(AuthActions.restoreRequested());
    expect(current).toBeNull();
  });
  it('registers without exposing credentials in actions', () => {
    api.register.and.returnValue(of({ id: 1, username: 'ana' }));
    const emitted: Action[] = [];
    effects.register$.subscribe((action) => emitted.push(action));
    commands.register({ username: 'ana', password: 'private-password' });
    expect(emitted).toEqual([
      AuthActions.registrationStarted(),
      AuthActions.registrationSucceeded(),
    ]);
    expect(JSON.stringify(emitted)).not.toContain('private-password');
  });
});
