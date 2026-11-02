import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { provideFoundationTesting } from '../../../testing/test-providers';
import { AuthCommands } from '../../core/auth/auth.commands';
import { AuthActions } from '../../core/auth/auth.state';
import { LoginComponent } from './login.component';
describe('Login form', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let submit: jasmine.Spy;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: provideFoundationTesting(),
    }).compileComponents();
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    submit = spyOn(TestBed.inject(AuthCommands), 'login');
    fixture.detectChanges();
  });
  it('blocks invalid credentials and exposes field errors', () => {
    component.login();
    fixture.detectChanges();
    expect(submit).not.toHaveBeenCalled();
    expect(component.form.controls.username.touched).toBeTrue();
    expect(fixture.nativeElement.querySelector('mat-error').textContent).toContain('Preencha');
  });
  it('trims username while preserving password spaces', () => {
    component.form.setValue({ username: ' ANA ', password: ' password-example ' });
    component.login();
    expect(submit).toHaveBeenCalledWith({ username: 'ANA', password: ' password-example ' });
  });
  it('disables repeated UI submission while pending', () => {
    TestBed.inject(Store).dispatch(AuthActions.loginStarted());
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBeTrue();
  });
  it('associates server validation with its field', () => {
    TestBed.inject(Store).dispatch(
      AuthActions.loginFailed({
        error: {
          code: 'validation_failed',
          message: 'Revise os campos.',
          details: [{ field: 'username', message: 'Nome inválido.' }],
        },
      }),
    );
    fixture.detectChanges();
    expect(component.form.controls.username.getError('server')).toBe('Nome inválido.');
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'Revise os campos.',
    );
  });
});
