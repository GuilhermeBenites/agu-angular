import { FormControl, FormGroup } from '@angular/forms';
import { matchingPasswords, passwordValidator, usernameValidator } from './credential-validators';
describe('Credential validation', () => {
  it('validates the normalized username and rejects invalid characters', () => {
    expect(usernameValidator(new FormControl(' ANA '))).toBeNull();
    for (const name of ['ab', 'name with space', '_name', 'a'.repeat(51)])
      expect(usernameValidator(new FormControl(name))).toEqual({ username: true });
  });
  it('counts Unicode characters and UTF-8 bytes separately', () => {
    expect(passwordValidator(new FormControl('é'.repeat(7)))).toEqual({ passwordLength: true });
    expect(passwordValidator(new FormControl('é'.repeat(36)))).toBeNull();
    expect(passwordValidator(new FormControl('é'.repeat(37)))).toEqual({ passwordBytes: true });
    expect(passwordValidator(new FormControl('😀'.repeat(18)))).toBeNull();
  });
  it('requires confirmation to match exactly, including spaces', () => {
    const group = new FormGroup({
      password: new FormControl('password '),
      confirmation: new FormControl('password'),
    });
    expect(matchingPasswords(group)).toEqual({ passwordMismatch: true });
    group.controls.confirmation.setValue('password ');
    expect(matchingPasswords(group)).toBeNull();
  });
});
