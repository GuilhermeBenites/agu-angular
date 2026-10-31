import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { distinctUntilChanged, map } from 'rxjs';
import { AuthFacade } from '../../core/auth/auth.facade';
import { AuthShellComponent } from '../../shared/auth-shell/auth-shell.component';
import {
  ConfirmationErrorMatcher,
  fieldError,
  matchingPasswords,
  passwordValidator,
  usernameValidator,
} from '../../shared/credential-validators';
@Component({
  selector: 'app-register',
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
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  readonly auth = inject(AuthFacade);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  readonly form = this.fb.nonNullable.group(
    {
      username: ['', [Validators.required, usernameValidator]],
      password: ['', [Validators.required, passwordValidator]],
      confirmation: ['', [Validators.required]],
    },
    { validators: matchingPasswords },
  );
  readonly fieldError = fieldError;
  readonly confirmationMatcher = new ConfirmationErrorMatcher();
  showPassword = false;
  showConfirmation = false;
  constructor() {
    this.auth.clearErrors();
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.auth.clearErrors());
    this.auth.state$
      .pipe(
        map((state) => state.registrationError),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((error) => {
        if (error?.code === 'username_taken')
          this.form.controls.username.setErrors({ server: 'Esse nome de usuário já está em uso.' });
        for (const detail of error?.details ?? [])
          if (detail.field === 'username' || detail.field === 'password')
            this.form.controls[detail.field].setErrors({ server: detail.message });
      });
  }
  register(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    this.auth.register({ username: value.username.trim(), password: value.password });
  }
}
