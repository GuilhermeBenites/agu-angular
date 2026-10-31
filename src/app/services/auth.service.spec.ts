import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { provideFoundationTesting, TEST_API_URL } from '../../testing/test-providers';
import { AuthService } from './auth.service';
describe('AuthService API contract', () => {
  let api: AuthService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideFoundationTesting() });
    api = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('uses the configured login URL and validates the response shape', () => {
    api
      .login('ana', 'password-example')
      .subscribe((response) => expect(response.user).toEqual({ id: 1, username: 'ana' }));
    const req = http.expectOne(`${TEST_API_URL}/login`);
    expect(req.request.body).toEqual({ username: 'ana', password: 'password-example' });
    req.flush({
      token: 'example',
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: { id: 1, username: 'ana' },
    });
  });
  it('returns the public user after registration', () => {
    api
      .register('ana', 'password-example')
      .subscribe((user) => expect(user).toEqual({ id: 1, username: 'ana' }));
    http.expectOne(`${TEST_API_URL}/register`).flush({ id: 1, username: 'ana' });
  });
  it('loads the verified session identity', () => {
    api.me().subscribe((user) => expect(user.username).toBe('ana'));
    http.expectOne(`${TEST_API_URL}/me`).flush({ id: 1, username: 'ana' });
  });
  it('rejects an incomplete success body rather than creating a broken session', () => {
    const rejected = jasmine.createSpy('rejected');
    api.login('ana', 'password-example').subscribe({ error: rejected });
    http.expectOne(`${TEST_API_URL}/login`).flush({ token: 'example' });
    expect(rejected).toHaveBeenCalled();
  });
  it('bounds session restoration time so the UI can offer a retry', fakeAsync(() => {
    const rejected = jasmine.createSpy('rejected');
    api.me().subscribe({ error: rejected });
    const request = http.expectOne(`${TEST_API_URL}/me`);
    tick(10001);
    expect(rejected).toHaveBeenCalled();
    expect(request.cancelled).toBeTrue();
  }));
});
