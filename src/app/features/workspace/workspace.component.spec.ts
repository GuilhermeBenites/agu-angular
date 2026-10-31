import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { provideFoundationTesting } from '../../../testing/test-providers';
import { exampleTask, exampleTaskPage } from '../../../testing/tasks';
import { TasksFacade } from '../tasks/tasks.facade';
import { TasksActions as A } from '../tasks/tasks.state';
import { WorkspaceComponent } from './workspace.component';

describe('Tasks workspace', () => {
  let fixture: ComponentFixture<WorkspaceComponent>;
  let component: WorkspaceComponent;
  let facade: TasksFacade;
  let store: Store;
  let open: jasmine.Spy;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkspaceComponent],
      providers: provideFoundationTesting(),
    }).compileComponents();
    facade = TestBed.inject(TasksFacade);
    store = TestBed.inject(Store);
    fixture = TestBed.createComponent(WorkspaceComponent);
    component = fixture.componentInstance;
    open = spyOn(TestBed.inject(MatDialog), 'open');
    fixture.detectChanges();
  });
  it('shows loading, retryable failure, and an empty state', () => {
    expect(fixture.nativeElement.textContent).toContain('Organizando seu espaço');
    store.dispatch(
      A.listFailed({ error: { code: 'internal_error', message: 'Indisponível.', details: [] } }),
    );
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=alert]').textContent).toContain(
      'Indisponível.',
    );
    store.dispatch(
      A.listSucceeded({
        result: { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
      }),
    );
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Criar minha primeira tarefa');
  });
  it('renders titles as text and dispatches pagination', () => {
    store.dispatch(
      A.listSucceeded({
        result: {
          ...exampleTaskPage,
          items: [{ ...exampleTask, title: '<script>alert(1)</script>' }],
        },
      }),
    );
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.task-title').textContent).toContain('<script>');
    expect(fixture.nativeElement.querySelector('script')).toBeNull();
    const list = spyOn(facade, 'list');
    component.paginate({ pageIndex: 1, pageSize: 10, length: 21 });
    expect(list).toHaveBeenCalledWith(2, 10);
  });
  it('does not delete after cancellation and deletes only on confirmation', () => {
    const remove = spyOn(facade, 'delete');
    open.and.returnValue({ afterClosed: () => of(false) });
    component.confirmDelete(exampleTask);
    expect(remove).not.toHaveBeenCalled();
    open.and.returnValue({ afterClosed: () => of(true) });
    component.confirmDelete(exampleTask);
    expect(remove).toHaveBeenCalledOnceWith(42);
  });
});
