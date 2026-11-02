import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { take } from 'rxjs';
import { NavComponent } from '../../components/nav/nav.component';
import { AuthFacade } from '../../core/auth/auth.facade';
import { Task } from '../../core/api/task';
import { TasksFacade } from '../tasks/tasks.facade';
import { DeleteTaskDialogComponent } from '../tasks/delete-task-dialog.component';

export function taskPaginatorIntl(): MatPaginatorIntl {
  const intl = new MatPaginatorIntl();
  intl.itemsPerPageLabel = 'Por página';
  intl.nextPageLabel = 'Próxima página';
  intl.previousPageLabel = 'Página anterior';
  intl.firstPageLabel = 'Primeira página';
  intl.lastPageLabel = 'Última página';
  intl.getRangeLabel = (page, size, total) =>
    total === 0
      ? '0 tarefas'
      : `${page * size + 1}–${Math.min((page + 1) * size, total)} de ${total}`;
  return intl;
}
@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [
    AsyncPipe,
    DatePipe,
    RouterLink,
    NavComponent,
    MatButtonModule,
    MatPaginatorModule,
    MatProgressBarModule,
  ],
  providers: [{ provide: MatPaginatorIntl, useFactory: taskPaginatorIntl }],
  templateUrl: './workspace.component.html',
  styleUrl: './workspace.component.scss',
})
export class WorkspaceComponent implements OnInit {
  readonly auth = inject(AuthFacade);
  readonly tasks = inject(TasksFacade);
  private readonly dialog = inject(MatDialog);
  ngOnInit() {
    this.tasks.state$.pipe(take(1)).subscribe((s) => this.tasks.list(s.page, s.limit));
  }
  paginate(event: PageEvent) {
    this.tasks.list(event.pageIndex + 1, event.pageSize);
  }
  retry(page: number, limit: number) {
    this.tasks.list(page, limit);
  }
  confirmDelete(task: Task) {
    this.dialog
      .open(DeleteTaskDialogComponent, {
        data: task,
        width: '440px',
        maxWidth: 'calc(100vw - 32px)',
        autoFocus: '[cdkFocusInitial]',
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe((confirmed: boolean | undefined) => {
        if (confirmed) this.tasks.delete(task.id);
      });
  }
}
