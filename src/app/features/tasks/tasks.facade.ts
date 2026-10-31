import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { TaskInput } from '../../core/api/task';
import { TasksActions, tasksFeature, selectTaskRange } from './tasks.state';
@Injectable({ providedIn: 'root' })
export class TasksFacade {
  private readonly store = inject(Store);
  readonly state$ = this.store.select(tasksFeature.selectTasksState);
  readonly range$ = this.store.select(selectTaskRange);
  list(page: number, limit: number) {
    this.store.dispatch(TasksActions.listRequested({ page, limit }));
  }
  open() {
    this.store.dispatch(TasksActions.formOpened());
  }
  close() {
    this.store.dispatch(TasksActions.formClosed());
  }
  get(id: number) {
    this.store.dispatch(TasksActions.detailRequested({ id }));
  }
  save(id: number | null, input: TaskInput) {
    this.store.dispatch(TasksActions.saveRequested({ id, input }));
  }
  delete(id: number) {
    this.store.dispatch(TasksActions.deleteRequested({ id }));
  }
}
