import { AuthActions, authFeature, initialAuthState, resetSessionState } from './auth.state';
const user = { id: 1, username: 'ana' };
const error = { code: 'invalid_credentials', message: 'Inválido', details: [] };
describe('Authentication state', () => {
  it('exposes an authenticated user and clears pending/error state', () => {
    const pending = authFeature.reducer(
      { ...initialAuthState, loginError: error },
      AuthActions.loginStarted(),
    );
    expect(pending.loginPending).toBeTrue();
    const state = authFeature.reducer(pending, AuthActions.loginSucceeded({ user }));
    expect(state.user).toEqual(user);
    expect(state.status).toBe('authenticated');
    expect(state.loginPending).toBeFalse();
    expect(state.loginError).toBeNull();
    expect(authFeature.selectUser.projector(state)).toEqual(user);
  });
  it('preserves a retryable unavailable session as distinct from anonymous', () => {
    const state = authFeature.reducer(initialAuthState, AuthActions.sessionUnavailable({ error }));
    expect(state.status).toBe('unavailable');
    expect(state.sessionError).toEqual(error);
    expect(state.user).toBeNull();
  });
  it('resets authentication and unrelated feature state when the session ends', () => {
    for (const action of [
      AuthActions.logout(),
      AuthActions.sessionExpired(),
      AuthActions.sessionAnonymous(),
    ]) {
      const root = resetSessionState((state = { tasks: ['default'] }) => state);
      expect(root({ tasks: ['private-task'] }, action)).toEqual({ tasks: ['default'] });
      expect(
        authFeature.reducer(
          { ...initialAuthState, user, status: 'authenticated', loginError: error },
          action,
        ),
      ).toEqual({ ...initialAuthState, status: 'anonymous' });
    }
  });
  it('keeps API failures in the corresponding form and allows clearing them', () => {
    let state = authFeature.reducer(initialAuthState, AuthActions.loginFailed({ error }));
    state = authFeature.reducer(state, AuthActions.registrationFailed({ error }));
    expect(state.loginError).toEqual(error);
    expect(state.registrationError).toEqual(error);
    state = authFeature.reducer(state, AuthActions.clearFormErrors());
    expect(state.loginError).toBeNull();
    expect(state.registrationError).toBeNull();
  });
});
