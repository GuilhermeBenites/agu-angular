import { APP_INITIALIZER, ApplicationConfig, Injector } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { firstValueFrom } from 'rxjs';
import { routes } from './app-routes';
import { API_CONFIG } from './core/config/api-config';
import { RuntimeConfigService } from './core/config/runtime-config.service';
import { AuthFacade } from './core/auth/auth.facade';
import { authFeature, resetSessionState } from './core/auth/auth.state';
import { AuthEffects } from './core/auth/auth.effects';
import { tasksFeature } from './features/tasks/tasks.state';
import { TasksEffects } from './features/tasks/tasks.effects';
import { authInterceptor } from './core/auth/auth.interceptor';

export function initializeRuntimeConfig(
  config: RuntimeConfigService,
  injector: Injector,
): () => Promise<void> {
  return async () => {
    await config.load();
    await firstValueFrom(injector.get(AuthFacade).initialize());
  };
}
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeRuntimeConfig,
      deps: [RuntimeConfigService, Injector],
      multi: true,
    },
    {
      provide: API_CONFIG,
      useFactory: (config: RuntimeConfigService) => ({
        get apiBaseUrl() {
          return config.value.apiBaseUrl;
        },
      }),
      deps: [RuntimeConfigService],
    },
    provideStore(
      { auth: authFeature.reducer, tasks: tasksFeature.reducer },
      { metaReducers: [resetSessionState] },
    ),
    provideEffects(AuthEffects, TasksEffects),
    provideRouter(routes),
  ],
};
