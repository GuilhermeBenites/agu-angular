import {
  createActionGroup,
  createFeature,
  createReducer,
  createSelector,
  emptyProps,
  on,
  props,
} from '@ngrx/store';
import { Task, TaskInput, TaskPage, Pagination } from '../../core/api/task';
import { ApiFailure } from '../../core/auth/auth.models';

export interface TasksState {
  items: Task[];
  pagination: Pagination;
  page: number;
  limit: number;
  loading: boolean;
  listError: ApiFailure | null;
  selected: Task | null;
  detailLoading: boolean;
  detailError: ApiFailure | null;
  saving: boolean;
  saveError: ApiFailure | null;
  deletingId: number | null;
  deleteError: ApiFailure | null;
  notice: string | null;
}
export const initialTasksState: TasksState = {
  items: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  page: 1,
  limit: 20,
  loading: false,
  listError: null,
  selected: null,
  detailLoading: false,
  detailError: null,
  saving: false,
  saveError: null,
  deletingId: null,
  deleteError: null,
  notice: null,
};
export const TasksActions = createActionGroup({
  source: 'Tasks',
  events: {
    'List Requested': props<{ page: number; limit: number }>(),
    'List Succeeded': props<{ result: TaskPage }>(),
    'List Failed': props<{ error: ApiFailure }>(),
    'Detail Requested': props<{ id: number }>(),
    'Detail Succeeded': props<{ task: Task }>(),
    'Detail Failed': props<{ error: ApiFailure }>(),
    'Form Opened': emptyProps(),
    'Form Closed': emptyProps(),
    'Save Requested': props<{ id: number | null; input: TaskInput }>(),
    'Save Succeeded': props<{ task: Task; created: boolean }>(),
    'Save Failed': props<{ error: ApiFailure }>(),
    'Delete Requested': props<{ id: number }>(),
    'Delete Succeeded': props<{ id: number }>(),
    'Delete Failed': props<{ error: ApiFailure }>(),
  },
});
export const tasksFeature = createFeature({
  name: 'tasks',
  reducer: createReducer(
    initialTasksState,
    on(TasksActions.listRequested, (s, { page, limit }) => ({
      ...s,
      page,
      limit,
      loading: true,
      listError: null,
    })),
    on(TasksActions.listSucceeded, (s, { result }) => ({
      ...s,
      items: result.items,
      pagination: result.pagination,
      page: result.pagination.page,
      limit: result.pagination.limit,
      loading: false,
      listError: null,
    })),
    on(TasksActions.listFailed, (s, { error }) => ({ ...s, loading: false, listError: error })),
    on(TasksActions.formOpened, TasksActions.formClosed, (s) => ({
      ...s,
      selected: null,
      detailLoading: false,
      detailError: null,
      saving: false,
      saveError: null,
    })),
    on(TasksActions.detailRequested, (s) => ({
      ...s,
      selected: null,
      detailLoading: true,
      detailError: null,
      saveError: null,
    })),
    on(TasksActions.detailSucceeded, (s, { task }) => ({
      ...s,
      selected: task,
      detailLoading: false,
    })),
    on(TasksActions.detailFailed, (s, { error }) => ({
      ...s,
      detailLoading: false,
      detailError: error,
    })),
    on(TasksActions.saveRequested, (s) => ({ ...s, saving: true, saveError: null, notice: null })),
    on(TasksActions.saveSucceeded, (s, { created }) => ({
      ...s,
      saving: false,
      selected: null,
      page: created ? 1 : s.page,
      notice: created ? 'Tarefa criada.' : 'Tarefa atualizada.',
    })),
    on(TasksActions.saveFailed, (s, { error }) => ({ ...s, saving: false, saveError: error })),
    on(TasksActions.deleteRequested, (s, { id }) => ({
      ...s,
      deletingId: id,
      deleteError: null,
      notice: null,
    })),
    on(TasksActions.deleteSucceeded, (s, { id }) => ({
      ...s,
      deletingId: null,
      items: s.items.filter((t) => t.id !== id),
      notice: 'Tarefa excluída.',
    })),
    on(TasksActions.deleteFailed, (s, { error }) => ({
      ...s,
      deletingId: null,
      deleteError: error,
    })),
  ),
});
export const selectTaskRange = createSelector(tasksFeature.selectPagination, (p) => ({
  start: p.total === 0 ? 0 : (p.page - 1) * p.limit + 1,
  end: Math.min(p.page * p.limit, p.total),
}));
