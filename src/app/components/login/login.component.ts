import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { distinctUntilChanged, map } from 'rxjs';
import { AuthFacade } from '../../core/auth/auth.facade';
import { AuthShellComponent } from '../../shared/auth-shell/auth-shell.component';
import {
  fieldError,
  passwordValidator,
  usernameValidator,
} from '../../shared/credential-validators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    RouterLink,
    AuthShellComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  readonly auth = inject(AuthFacade);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, usernameValidator]],
    password: ['', [Validators.required, passwordValidator]],
  });
  readonly registered = this.route.snapshot.queryParamMap.get('registered') === '1';
  readonly expired = this.route.snapshot.queryParamMap.get('reason') === 'expired';
  readonly fieldError = fieldError;
  showPassword = false;
  constructor() {
    this.auth.clearErrors();
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.auth.clearErrors());
    this.auth.state$
      .pipe(
        map((state) => state.loginError),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((error) => {
        for (const detail of error?.details ?? []) {
          if (detail.field === 'username' || detail.field === 'password')
            this.form.controls[detail.field].setErrors({ server: detail.message });
        }
      });
  }
  login(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    this.auth.login({ username: value.username.trim(), password: value.password });
  }
}
