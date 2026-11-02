import {
  AbstractControl,
  FormControl,
  FormGroupDirective,
  NgForm,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';

export const usernameValidator: ValidatorFn = (
  control: AbstractControl<string>,
): ValidationErrors | null =>
  !control.value || /^[A-Za-z0-9][A-Za-z0-9._-]{2,49}$/.test(control.value.trim())
    ? null
    : { username: true };
export const passwordValidator: ValidatorFn = (
  control: AbstractControl<string>,
): ValidationErrors | null => {
  const value = control.value;
  if (!value) return null;
  if (Array.from(value).length < 8) return { passwordLength: true };
  if (new TextEncoder().encode(value).length > 72) return { passwordBytes: true };
  return null;
};
export const matchingPasswords: ValidatorFn = (group: AbstractControl): ValidationErrors | null =>
  group.get('password')?.value === group.get('confirmation')?.value
    ? null
    : { passwordMismatch: true };
export class ConfirmationErrorMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    return (
      !!control &&
      !!(control.invalid || control.parent?.hasError('passwordMismatch')) &&
      !!(control.touched || form?.submitted)
    );
  }
}
export function fieldError(control: AbstractControl): string {
  const errors = control.errors ?? {};
  if (typeof errors['server'] === 'string') return errors['server'];
  if (errors['required']) return 'Preencha este campo.';
  if (errors['username']) return 'Use de 3 a 50 letras, números, ponto, hífen ou _.';
  if (errors['passwordLength']) return 'Use pelo menos 8 caracteres.';
  if (errors['passwordBytes']) return 'Essa senha é muito longa. Tente uma senha menor.';
  return '';
}
