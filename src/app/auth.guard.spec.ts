import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  provideRouter,
} from '@angular/router';
import { BehaviorSubject, firstValueFrom, isObservable } from 'rxjs';
import { authGuard, guestGuard } from './auth.guard';
import { AuthFacade } from './core/auth/auth.facade';
import { AuthState, initialAuthState } from './core/auth/auth.state';
describe('Session route guards', () => {
  let state: BehaviorSubject<AuthState>;
  beforeEach(() => {
    state = new BehaviorSubject<AuthState>({ ...initialAuthState, status: 'anonymous' });
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthFacade, useValue: { state$: state } }],
    });
  });
  function evaluate(guard: CanActivateFn) {
    const result = TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, { url: '/tasks' } as RouterStateSnapshot),
    );
    if (!isObservable(result)) throw new Error('Expected async guard');
    return firstValueFrom(result);
  }
  it('waits for restoration before granting protected access', async () => {
    state.next({ ...initialAuthState });
    let resolved = false;
    const result = evaluate(authGuard).then((value) => {
      resolved = true;
      return value;
    });
    await Promise.resolve();
    expect(resolved).toBeFalse();
    state.next({ ...initialAuthState, status: 'authenticated', user: { id: 1, username: 'ana' } });
    expect(await result).toBeTrue();
  });
  it('redirects anonymous users to login and unavailable sessions to recovery', async () => {
    expect(
      TestBed.inject(Router).serializeUrl(
        (await evaluate(authGuard)) as import('@angular/router').UrlTree,
      ),
    ).toBe('/login');
    state.next({ ...initialAuthState, status: 'unavailable' });
    expect(
      TestBed.inject(Router).serializeUrl(
        (await evaluate(authGuard)) as import('@angular/router').UrlTree,
      ),
    ).toBe('/session');
  });
  it('keeps authenticated users out of guest forms', async () => {
    state.next({ ...initialAuthState, status: 'authenticated', user: { id: 1, username: 'ana' } });
    expect(
      TestBed.inject(Router).serializeUrl(
        (await evaluate(guestGuard)) as import('@angular/router').UrlTree,
      ),
    ).toBe('/tasks');
  });
});
