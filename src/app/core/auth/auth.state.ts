import {
  ActionReducer,
  createActionGroup,
  createFeature,
  createReducer,
  emptyProps,
  on,
  props,
} from '@ngrx/store';
import { ApiFailure, SessionStatus, User } from './auth.models';

export interface AuthState {
  status: SessionStatus;
  user: User | null;
  loginPending: boolean;
  registrationPending: boolean;
  loginError: ApiFailure | null;
  registrationError: ApiFailure | null;
  sessionError: ApiFailure | null;
}
export const initialAuthState: AuthState = {
  status: 'checking',
  user: null,
  loginPending: false,
  registrationPending: false,
  loginError: null,
  registrationError: null,
  sessionError: null,
};
export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    'Restore Requested': emptyProps(),
    'Session Restored': props<{ user: User }>(),
    'Session Anonymous': emptyProps(),
    'Session Unavailable': props<{ error: ApiFailure }>(),
    'Login Started': emptyProps(),
    'Login Succeeded': props<{ user: User }>(),
    'Login Failed': props<{ error: ApiFailure }>(),
    'Registration Started': emptyProps(),
    'Registration Succeeded': emptyProps(),
    'Registration Failed': props<{ error: ApiFailure }>(),
    'Clear Form Errors': emptyProps(),
    Logout: emptyProps(),
    'Session Expired': emptyProps(),
  },
});
export const authFeature = createFeature({
  name: 'auth',
  reducer: createReducer(
    initialAuthState,
    on(AuthActions.restoreRequested, (state) => ({
      ...state,
      status: 'checking' as const,
      user: null,
      sessionError: null,
    })),
    on(AuthActions.sessionRestored, AuthActions.loginSucceeded, (state, { user }) => ({
      ...state,
      status: 'authenticated' as const,
      user,
      loginPending: false,
      loginError: null,
      sessionError: null,
    })),
    on(AuthActions.sessionAnonymous, AuthActions.logout, AuthActions.sessionExpired, () => ({
      ...initialAuthState,
      status: 'anonymous' as const,
    })),
    on(AuthActions.sessionUnavailable, (state, { error }) => ({
      ...state,
      status: 'unavailable' as const,
      user: null,
      sessionError: error,
    })),
    on(AuthActions.loginStarted, (state) => ({ ...state, loginPending: true, loginError: null })),
    on(AuthActions.loginFailed, (state, { error }) => ({
      ...state,
      loginPending: false,
      loginError: error,
    })),
    on(AuthActions.registrationStarted, (state) => ({
      ...state,
      registrationPending: true,
      registrationError: null,
    })),
    on(AuthActions.registrationSucceeded, (state) => ({
      ...state,
      registrationPending: false,
      registrationError: null,
    })),
    on(AuthActions.registrationFailed, (state, { error }) => ({
      ...state,
      registrationPending: false,
      registrationError: error,
    })),
    on(AuthActions.clearFormErrors, (state) => ({
      ...state,
      loginError: null,
      registrationError: null,
    })),
  ),
});

export function resetSessionState<State>(reducer: ActionReducer<State>): ActionReducer<State> {
  return (state, action) =>
    reducer(
      [
        AuthActions.logout.type,
        AuthActions.sessionExpired.type,
        AuthActions.sessionAnonymous.type,
      ].some((type) => type === action.type)
        ? undefined
        : state,
      action,
    );
}
