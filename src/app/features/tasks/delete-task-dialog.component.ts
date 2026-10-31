import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Task } from '../../core/api/task';
@Component({
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `<h2 mat-dialog-title>Excluir tarefa?</h2>
    <mat-dialog-content
      ><p class="task-name">{{ task.title }}</p>
      <p>Esta tarefa será removida permanentemente.</p></mat-dialog-content
    ><mat-dialog-actions align="end"
      ><button mat-button [mat-dialog-close]="false" cdkFocusInitial>Cancelar</button
      ><button mat-flat-button color="warn" [mat-dialog-close]="true">
        Excluir tarefa
      </button></mat-dialog-actions
    >`,
  styles: [
    `
      .task-name {
        color: #264d37;
        font-weight: 500;
        overflow-wrap: anywhere;
      }
      mat-dialog-content {
        font-size: 14px;
      }
      mat-dialog-actions {
        padding: 16px 24px 24px;
        gap: 8px;
      }
    `,
  ],
})
export class DeleteTaskDialogComponent {
  readonly task = inject<Task>(MAT_DIALOG_DATA);
}
