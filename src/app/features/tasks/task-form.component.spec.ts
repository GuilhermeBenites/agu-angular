import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs';
import { provideFoundationTesting } from '../../../testing/test-providers';
import { exampleTask } from '../../../testing/tasks';
import { TaskFormComponent } from './task-form.component';
import { TasksFacade } from './tasks.facade';
import { TasksActions as A } from './tasks.state';

describe('Task reactive form', () => {
  let fixture: ComponentFixture<TaskFormComponent>;
  let component: TaskFormComponent;
  let facade: TasksFacade;
  let store: Store;
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  beforeEach(async () => {
    params = new BehaviorSubject(convertToParamMap({}));
    await TestBed.configureTestingModule({
      imports: [TaskFormComponent],
      providers: [
        ...provideFoundationTesting(),
        { provide: ActivatedRoute, useValue: { paramMap: params } },
      ],
    }).compileComponents();
    facade = TestBed.inject(TasksFacade);
    store = TestBed.inject(Store);
    fixture = TestBed.createComponent(TaskFormComponent);
    component = fixture.componentInstance;
  });
  it('blocks blank and oversized input and preserves raw text for API validation', () => {
    const save = spyOn(facade, 'save');
    fixture.detectChanges();
    component.submit();
    expect(save).not.toHaveBeenCalled();
    component.form.setValue({ title: ' ', description: '' });
    component.submit();
    expect(save).not.toHaveBeenCalled();
    component.form.controls.title.setValue('é'.repeat(256));
    component.submit();
    expect(save).not.toHaveBeenCalled();
    component.form.setValue({ title: ' Ideia ', description: 'detalhes' });
    component.submit();
    expect(save).toHaveBeenCalledWith(null, { title: ' Ideia ', description: 'detalhes' });
  });
  it('counts Unicode code points and enforces the description limit', () => {
    fixture.detectChanges();
    component.form.setValue({ title: '🌿'.repeat(255), description: 'é'.repeat(10000) });
    expect(component.form.valid).toBeTrue();
    component.form.controls.description.setValue('é'.repeat(10001));
    expect(component.form.invalid).toBeTrue();
  });
  it('loads a deep linked task and retains edited values through failed saves', () => {
    params.next(convertToParamMap({ id: '42' }));
    const get = spyOn(facade, 'get').and.callThrough();
    fixture.detectChanges();
    expect(get).toHaveBeenCalledWith(42);
    expect(fixture.nativeElement.textContent).toContain('Buscando sua tarefa');
    store.dispatch(A.detailSucceeded({ task: exampleTask }));
    fixture.detectChanges();
    expect(component.form.controls.title.value).toBe(exampleTask.title);
    component.form.setValue({ title: 'Minha edição', description: 'Manter após erro' });
    store.dispatch(A.saveRequested({ id: 42, input: component.form.getRawValue() }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button[type=submit]').disabled).toBeTrue();
    store.dispatch(
      A.saveFailed({
        error: {
          code: 'validation_failed',
          message: 'Revise os campos.',
          details: [{ field: 'title', message: 'Título inválido.' }],
        },
      }),
    );
    fixture.detectChanges();
    expect(component.form.getRawValue()).toEqual({
      title: 'Minha edição',
      description: 'Manter após erro',
    });
    expect(fixture.nativeElement.querySelector('[role=alert]').textContent).toContain(
      'Título inválido.',
    );
    expect(fixture.nativeElement.querySelector('button[type=submit]').disabled).toBeFalse();
  });
  it('does not request an invalid ID and displays not found', () => {
    params.next(convertToParamMap({ id: 'abc' }));
    const get = spyOn(facade, 'get');
    fixture.detectChanges();
    expect(get).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Tarefa não encontrada.');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });
  it('shows an owner-scoped 404 without an editable form', () => {
    params.next(convertToParamMap({ id: '42' }));
    fixture.detectChanges();
    store.dispatch(
      A.detailFailed({
        error: { code: 'task_not_found', message: 'Tarefa não encontrada.', details: [] },
      }),
    );
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=alert]').textContent).toContain(
      'Tarefa não encontrada.',
    );
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });
});
