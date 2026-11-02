import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, OnDestroy, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, ValidatorFn } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { distinctUntilChanged, filter, map } from 'rxjs';
import { NavComponent } from '../../components/nav/nav.component';
import { TasksFacade } from './tasks.facade';

export const taskTitleValidator: ValidatorFn = (control) =>
  typeof control.value !== 'string' || control.value.trim().length === 0
    ? { required: true }
    : Array.from(control.value).length > 255
      ? { maxlength: true }
      : null;
export const taskDescriptionValidator: ValidatorFn = (control) =>
  typeof control.value === 'string' && Array.from(control.value).length > 10000
    ? { maxlength: true }
    : null;
@Component({
  standalone: true,
  selector: 'app-task-form',
  imports: [
    AsyncPipe,
    RouterLink,
    ReactiveFormsModule,
    NavComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
  ],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.scss',
})
export class TaskFormComponent implements OnInit, OnDestroy {
  readonly tasks = inject(TasksFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  id: number | null = null;
  invalidId = false;
  readonly form = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [taskTitleValidator] }),
    description: new FormControl('', { nonNullable: true, validators: [taskDescriptionValidator] }),
  });
  ngOnInit() {
    this.tasks.open();
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const raw = params.get('id');
      this.id = raw === null ? null : Number(raw);
      this.invalidId =
        raw !== null &&
        (!/^[0-9]+$/.test(raw) ||
          !Number.isInteger(this.id) ||
          this.id! < 1 ||
          this.id! > 2147483647);
      this.form.reset();
      if (this.id !== null && !this.invalidId) this.tasks.get(this.id);
    });
    this.tasks.state$
      .pipe(
        map((s) => s.selected),
        distinctUntilChanged(),
        filter((task) => task !== null && task.id === this.id),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((task) =>
        this.form.setValue({ title: task!.title, description: task!.description ?? '' }),
      );
  }
  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.invalidId) return;
    const value = this.form.getRawValue();
    this.tasks.save(this.id, { title: value.title, description: value.description });
  }
  ngOnDestroy() {
    this.tasks.close();
  }
}
