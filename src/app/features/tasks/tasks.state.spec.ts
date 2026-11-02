import { combineReducers } from '@ngrx/store';
import { AuthActions, authFeature, resetSessionState } from '../../core/auth/auth.state';
import { exampleTask, exampleTaskPage } from '../../../testing/tasks';
import { TasksActions as A, tasksFeature, initialTasksState, selectTaskRange } from './tasks.state';
const error = { code: 'internal_error', message: 'Tente novamente.', details: [] };
describe('Task state and selectors', () => {
  const reducer = tasksFeature.reducer;
  it('preserves data on failed reload and clears errors for retry', () => {
    let s = reducer(initialTasksState, A.listSucceeded({ result: exampleTaskPage }));
    s = reducer(s, A.listRequested({ page: 2, limit: 20 }));
    expect(s.loading).toBeTrue();
    s = reducer(s, A.listFailed({ error }));
    expect(s.items).toEqual([exampleTask]);
    expect(s.loading).toBeFalse();
    s = reducer(s, A.listRequested({ page: 2, limit: 20 }));
    expect(s.listError).toBeNull();
  });
  it('keeps edit data through pending and failed saves and returns creation to page one', () => {
    let s = reducer({ ...initialTasksState, page: 3 }, A.detailSucceeded({ task: exampleTask }));
    s = reducer(s, A.saveRequested({ id: 42, input: { title: 'Alterada', description: null } }));
    expect(s.saving).toBeTrue();
    s = reducer(s, A.saveFailed({ error }));
    expect(s.selected).toEqual(exampleTask);
    expect(s.saving).toBeFalse();
    s = reducer(s, A.saveSucceeded({ task: exampleTask, created: true }));
    expect(s.page).toBe(1);
    expect(s.notice).toBe('Tarefa criada.');
  });
  it('removes only confirmed successful deletions and retains data on failure', () => {
    let s = reducer(initialTasksState, A.listSucceeded({ result: exampleTaskPage }));
    s = reducer(s, A.deleteRequested({ id: 42 }));
    expect(s.items.length).toBe(1);
    s = reducer(s, A.deleteFailed({ error }));
    expect(s.items.length).toBe(1);
    expect(s.deletingId).toBeNull();
    s = reducer(s, A.deleteSucceeded({ id: 42 }));
    expect(s.items).toEqual([]);
  });
  it('calculates visible ranges for empty and final pages', () => {
    expect(selectTaskRange.projector({ page: 1, limit: 20, total: 0, totalPages: 0 })).toEqual({
      start: 0,
      end: 0,
    });
    expect(selectTaskRange.projector({ page: 3, limit: 10, total: 25, totalPages: 3 })).toEqual({
      start: 21,
      end: 25,
    });
  });
  it('clears all task data and errors when the session ends', () => {
    const root = resetSessionState(combineReducers({ auth: authFeature.reducer, tasks: reducer }));
    const privateState = root(undefined, A.listSucceeded({ result: exampleTaskPage }));
    for (const action of [
      AuthActions.logout(),
      AuthActions.sessionExpired(),
      AuthActions.sessionAnonymous(),
    ]) {
      expect(root(privateState, action).tasks).toEqual(initialTasksState);
    }
  });
});
