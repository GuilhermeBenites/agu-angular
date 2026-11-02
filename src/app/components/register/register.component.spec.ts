import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { provideFoundationTesting } from '../../../testing/test-providers';
import { AuthCommands } from '../../core/auth/auth.commands';
import { AuthActions } from '../../core/auth/auth.state';
import { RegisterComponent } from './register.component';
describe('Registration form', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let submit: jasmine.Spy;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: provideFoundationTesting(),
    }).compileComponents();
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    submit = spyOn(TestBed.inject(AuthCommands), 'register');
    fixture.detectChanges();
  });
  it('requires confirmation and never submits it to the API command', () => {
    component.form.setValue({
      username: ' ANA ',
      password: 'password-example',
      confirmation: 'different-password',
    });
    component.register();
    expect(submit).not.toHaveBeenCalled();
    component.form.controls.confirmation.setValue('password-example');
    component.register();
    expect(submit).toHaveBeenCalledWith({ username: 'ANA', password: 'password-example' });
  });
  it('marks duplicate username inline and allows correcting it', () => {
    component.form.setValue({
      username: 'ana',
      password: 'password-example',
      confirmation: 'password-example',
    });
    TestBed.inject(Store).dispatch(
      AuthActions.registrationFailed({
        error: { code: 'username_taken', message: 'Indisponível.', details: [] },
      }),
    );
    expect(component.form.controls.username.hasError('server')).toBeTrue();
    component.form.controls.username.setValue('another-name');
    expect(component.form.controls.username.hasError('server')).toBeFalse();
  });
});
