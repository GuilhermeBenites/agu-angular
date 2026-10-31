import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './auth.guard';
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component').then((module) => module.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./components/register/register.component').then((module) => module.RegisterComponent),
    canActivate: [guestGuard],
  },
  ...['tasks/new', 'tasks/:id/edit'].map((path) => ({
    path,
    loadComponent: () =>
      import('./features/tasks/task-form.component').then((module) => module.TaskFormComponent),
    canActivate: [authGuard],
  })),
  {
    path: 'tasks',
    loadComponent: () =>
      import('./features/workspace/workspace.component').then(
        (module) => module.WorkspaceComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'session',
    loadComponent: () =>
      import('./features/session/session.component').then((module) => module.SessionComponent),
  },
  { path: '', redirectTo: 'tasks', pathMatch: 'full' },
  { path: '**', redirectTo: 'tasks' },
];
