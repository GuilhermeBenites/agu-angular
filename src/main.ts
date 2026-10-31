import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig).catch((error: unknown) => {
  console.error('Application initialization failed.', error);
  const root = document.querySelector('app-root');
  if (root) {
    root.setAttribute('role', 'alert');
    root.textContent = 'Não foi possível iniciar a aplicação. Tente novamente em instantes.';
  }
});
