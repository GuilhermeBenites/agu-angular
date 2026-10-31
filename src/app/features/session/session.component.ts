import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AuthFacade } from '../../core/auth/auth.facade';
import { AuthShellComponent } from '../../shared/auth-shell/auth-shell.component';
@Component({
  selector: 'app-session',
  standalone: true,
  imports: [AsyncPipe, MatButtonModule, AuthShellComponent],
  template: `<app-auth-shell
    ><span class="form-eyebrow">UM INSTANTE</span>
    <h1 class="auth-title">Vamos tentar<br />de novo?</h1>
    <p class="auth-description">
      Não conseguimos confirmar sua sessão agora. Sua conta continua aqui.
    </p>
    @if (auth.state$ | async; as vm) {
      <button
        mat-flat-button
        color="primary"
        class="primary-action"
        [disabled]="vm.status === 'checking'"
        (click)="auth.restore()"
      >
        {{ vm.status === 'checking' ? 'Conectando…' : 'Tentar novamente' }}
      </button>
    }
    <button mat-button class="session-alternative" (click)="auth.logout()">
      Entrar com outra conta
    </button></app-auth-shell
  >`,
  styles: [
    `
      .session-alternative {
        display: block;
        margin: 18px auto 0;
      }
    `,
  ],
})
export class SessionComponent {
  readonly auth = inject(AuthFacade);
}
