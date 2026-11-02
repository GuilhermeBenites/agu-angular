import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { authFeature, initialAuthState } from '../app/core/auth/auth.state';
import { tasksFeature } from '../app/features/tasks/tasks.state';
import { API_CONFIG } from '../app/core/config/api-config';

export const TEST_API_URL = 'https://api.example.test/api';

export function provideFoundationTesting() {
  return [
    provideHttpClient(),
    provideHttpClientTesting(),
    provideRouter([]),
    provideNoopAnimations(),
    provideStore(
      { auth: authFeature.reducer, tasks: tasksFeature.reducer },
      { initialState: { auth: { ...initialAuthState, status: 'anonymous' as const } } },
    ),
    { provide: API_CONFIG, useValue: { apiBaseUrl: TEST_API_URL } },
  ];
}
