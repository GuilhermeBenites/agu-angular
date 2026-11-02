import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Actions } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { Router } from '@angular/router';
import { Subject, of, throwError, Observable } from 'rxjs';
import { Task, TaskPage } from '../../core/api/task';
import { AuthActions } from '../../core/auth/auth.state';
import { TaskService } from '../../services/task.service';
import { exampleTask, exampleTaskPage } from '../../../testing/tasks';
import { TasksEffects } from './tasks.effects';
import { TasksActions as A, initialTasksState } from './tasks.state';

describe('Tasks effects', () => {
  let effects: TasksEffects;
  let actions: Subject<Action>;
  let api: jasmine.SpyObj<TaskService>;
  let store: MockStore;
  beforeEach(() => {
    actions = new Subject<Action>();
    api = jasmine.createSpyObj<TaskService>('TaskService', [
      'list',
      'get',
      'create',
      'update',
      'delete',
    ]);
    TestBed.configureTestingModule({
      providers: [
        TasksEffects,
        provideMockStore({ initialState: { tasks: initialTasksState } }),
        { provide: Actions, useValue: actions },
        { provide: TaskService, useValue: api },
        { provide: Router, useValue: { navigate: jasmine.createSpy().and.resolveTo(true) } },
      ],
    });
    effects = TestBed.inject(TasksEffects);
    store = TestBed.inject(MockStore);
  });
  afterEach(() => actions.complete());
  it('cancels superseded page requests and ignores their late responses', () => {
    const first = new Subject<TaskPage>();
    const second = new Subject<TaskPage>();
    api.list.and.returnValues(first, second);
    const emitted: Action[] = [];
    effects.list$.subscribe((a) => emitted.push(a));
    actions.next(A.listRequested({ page: 1, limit: 20 }));
    actions.next(A.listRequested({ page: 2, limit: 20 }));
    first.next(exampleTaskPage);
    expect(emitted).toEqual([]);
    second.next(exampleTaskPage);
    expect(emitted).toEqual([A.listSucceeded({ result: exampleTaskPage })]);
  });
  it('recovers from list failure and accepts a retry', () => {
    api.list.and.returnValues(
      throwError(() => new HttpErrorResponse({ status: 503 })),
      of(exampleTaskPage),
    );
    const emitted: Action[] = [];
    effects.list$.subscribe((a) => emitted.push(a));
    actions.next(A.listRequested({ page: 1, limit: 20 }));
    actions.next(A.listRequested({ page: 1, limit: 20 }));
    expect(emitted[0].type).toBe(A.listFailed.type);
    expect(emitted[1]).toEqual(A.listSucceeded({ result: exampleTaskPage }));
  });
  it('loads edit data and reports an opaque task-not-found error', () => {
    api.get.and.returnValues(
      of(exampleTask),
      throwError(
        () =>
          new HttpErrorResponse({
            status: 404,
            error: {
              error: { code: 'task_not_found', message: 'Tarefa não encontrada.', details: [] },
            },
          }),
      ),
    );
    const emitted: Action[] = [];
    effects.detail$.subscribe((a) => emitted.push(a));
    actions.next(A.detailRequested({ id: 42 }));
    actions.next(A.detailRequested({ id: 43 }));
    expect(emitted[0]).toEqual(A.detailSucceeded({ task: exampleTask }));
    expect(emitted[1].type).toBe(A.detailFailed.type);
  });
  it('prevents duplicate writes and allows retry after a failed save', () => {
    const pending = new Subject<Task>();
    api.create.and.returnValues(pending, of(exampleTask));
    const input = { title: 'Nova', description: null };
    const emitted: Action[] = [];
    effects.save$.subscribe((a) => emitted.push(a));
    actions.next(A.saveRequested({ id: null, input }));
    actions.next(A.saveRequested({ id: null, input }));
    expect(api.create).toHaveBeenCalledTimes(1);
    pending.error(new HttpErrorResponse({ status: 422 }));
    expect(emitted[0].type).toBe(A.saveFailed.type);
    actions.next(A.saveRequested({ id: null, input }));
    expect(emitted[1]).toEqual(A.saveSucceeded({ task: exampleTask, created: true }));
  });
  it('updates an existing task and navigates only after success', () => {
    const input = { title: 'Editada', description: null };
    api.update.and.returnValue(of(exampleTask));
    const emitted: Action[] = [];
    effects.save$.subscribe((a) => emitted.push(a));
    effects.savedNavigation$.subscribe();
    actions.next(A.saveRequested({ id: 42, input }));
    expect(api.update).toHaveBeenCalledWith(42, input);
    expect(emitted).toEqual([A.saveSucceeded({ task: exampleTask, created: false })]);
    const router = TestBed.inject(Router);
    expect(router.navigate).not.toHaveBeenCalled();
    actions.next(emitted[0]);
    expect(router.navigate).toHaveBeenCalledWith(['/tasks']);
  });
  it('cancels outstanding reads and writes when the session ends', () => {
    const list = new Subject<TaskPage>();
    const detail = new Subject<Task>();
    const save = new Subject<Task>();
    const deletion = new Subject<void>();
    api.list.and.returnValue(list);
    api.get.and.returnValue(detail);
    api.create.and.returnValue(save);
    api.delete.and.returnValue(deletion);
    const emitted: Action[] = [];
    (
      [effects.list$, effects.detail$, effects.save$, effects.delete$] as Observable<Action>[]
    ).forEach((effect) => effect.subscribe((a) => emitted.push(a)));
    actions.next(A.listRequested({ page: 1, limit: 20 }));
    actions.next(A.detailRequested({ id: 42 }));
    actions.next(A.saveRequested({ id: null, input: { title: 'Nova', description: null } }));
    actions.next(A.deleteRequested({ id: 42 }));
    actions.next(AuthActions.logout());
    list.next(exampleTaskPage);
    detail.next(exampleTask);
    save.next(exampleTask);
    deletion.next();
    expect(emitted).toEqual([]);
  });
  it('cancels a detail request when its form closes', () => {
    const pending = new Subject<Task>();
    api.get.and.returnValue(pending);
    const emitted: Action[] = [];
    effects.detail$.subscribe((a) => emitted.push(a));
    actions.next(A.detailRequested({ id: 42 }));
    actions.next(A.formClosed());
    pending.next(exampleTask);
    expect(emitted).toEqual([]);
  });
  it('preserves the delete flow after failure and reloads the prior page when its last item disappears', () => {
    api.delete.and.returnValues(
      throwError(() => new HttpErrorResponse({ status: 503 })),
      of(undefined),
    );
    const emitted: Action[] = [];
    effects.delete$.subscribe((a) => emitted.push(a));
    actions.next(A.deleteRequested({ id: 42 }));
    actions.next(A.deleteRequested({ id: 42 }));
    expect(emitted[0].type).toBe(A.deleteFailed.type);
    expect(emitted[1]).toEqual(A.deleteSucceeded({ id: 42 }));
    store.setState({
      tasks: {
        ...initialTasksState,
        page: 2,
        limit: 20,
        pagination: { page: 2, limit: 20, total: 21, totalPages: 2 },
      },
    });
    effects.deletedReload$.subscribe((a) => emitted.push(a));
    actions.next(A.deleteSucceeded({ id: 42 }));
    expect(emitted[2]).toEqual(A.listRequested({ page: 1, limit: 20 }));
  });
  it('recovers an empty page after deletion by another client', () => {
    const emitted: Action[] = [];
    effects.emptyPage$.subscribe((a) => emitted.push(a));
    actions.next(
      A.listSucceeded({
        result: { items: [], pagination: { page: 3, limit: 20, total: 20, totalPages: 1 } },
      }),
    );
    expect(emitted).toEqual([A.listRequested({ page: 1, limit: 20 })]);
  });
});
