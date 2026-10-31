import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { catchError, exhaustMap, map, of, switchMap, takeUntil, tap, withLatestFrom } from 'rxjs';
import { TaskService } from '../../services/task.service';
import { AuthActions } from '../../core/auth/auth.state';
import { apiFailure } from '../../core/auth/api-failure';
import { TasksActions, tasksFeature } from './tasks.state';

@Injectable()
export class TasksEffects {
  private readonly sessionEnded$ = this.actions$.pipe(
    ofType(AuthActions.logout, AuthActions.sessionExpired, AuthActions.sessionAnonymous),
  );
  private readonly formClosed$ = this.actions$.pipe(ofType(TasksActions.formClosed));
  readonly list$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.listRequested),
      switchMap(({ page, limit }) =>
        this.api.list(page, limit).pipe(
          map((result) => TasksActions.listSucceeded({ result })),
          catchError((error: unknown) => of(TasksActions.listFailed({ error: apiFailure(error) }))),
          takeUntil(this.sessionEnded$),
        ),
      ),
    ),
  );
  readonly detail$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.detailRequested),
      switchMap(({ id }) =>
        this.api.get(id).pipe(
          map((task) => TasksActions.detailSucceeded({ task })),
          catchError((error: unknown) =>
            of(TasksActions.detailFailed({ error: apiFailure(error) })),
          ),
          takeUntil(this.formClosed$),
          takeUntil(this.sessionEnded$),
        ),
      ),
    ),
  );
  readonly save$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.saveRequested),
      exhaustMap(({ id, input }) =>
        (id === null ? this.api.create(input) : this.api.update(id, input)).pipe(
          map((task) => TasksActions.saveSucceeded({ task, created: id === null })),
          catchError((error: unknown) => of(TasksActions.saveFailed({ error: apiFailure(error) }))),
          takeUntil(this.formClosed$),
          takeUntil(this.sessionEnded$),
        ),
      ),
    ),
  );
  readonly savedNavigation$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(TasksActions.saveSucceeded),
        tap(() => {
          void this.router.navigate(['/tasks']);
        }),
      ),
    { dispatch: false },
  );
  readonly delete$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.deleteRequested),
      exhaustMap(({ id }) =>
        this.api.delete(id).pipe(
          map(() => TasksActions.deleteSucceeded({ id })),
          catchError((error: unknown) =>
            of(TasksActions.deleteFailed({ error: apiFailure(error) })),
          ),
          takeUntil(this.sessionEnded$),
        ),
      ),
    ),
  );
  readonly deletedReload$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.deleteSucceeded),
      withLatestFrom(this.store.select(tasksFeature.selectTasksState)),
      map(([, s]) =>
        TasksActions.listRequested({
          page: Math.min(s.page, Math.max(1, Math.ceil((s.pagination.total - 1) / s.limit))),
          limit: s.limit,
        }),
      ),
    ),
  );
  // A different client can remove the final item on a page between visits.
  readonly emptyPage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.listSucceeded),
      switchMap(({ result }) =>
        result.items.length === 0 && result.pagination.page > 1
          ? of(
              TasksActions.listRequested({
                page: Math.max(1, result.pagination.totalPages),
                limit: result.pagination.limit,
              }),
            )
          : of(),
      ),
    ),
  );
  constructor(
    private readonly actions$: Actions,
    private readonly api: TaskService,
    private readonly store: Store,
    private readonly router: Router,
  ) {}
}
