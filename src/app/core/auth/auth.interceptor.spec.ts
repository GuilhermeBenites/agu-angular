import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { API_CONFIG } from '../config/api-config';
import { TokenStorage } from './token-storage.service';
import { AuthActions } from './auth.state';
import { authInterceptor } from './auth.interceptor';
describe('JWT interceptor', () => {
  let http: HttpTestingController;
  let client: HttpClient;
  let current: string | null;
  let dispatch: jasmine.Spy;
  beforeEach(() => {
    current = 'private-token';
    dispatch = jasmine.createSpy('dispatch');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { apiBaseUrl: 'https://api.example.test/api' } },
        { provide: TokenStorage, useValue: { read: () => current } },
        { provide: Store, useValue: { dispatch } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    client = TestBed.inject(HttpClient);
  });
  afterEach(() => http.verify());
  it('attaches Bearer to protected API calls only', () => {
    for (const url of ['https://api.example.test/api/me', 'https://api.example.test/api/tasks']) {
      client.get(url).subscribe();
      const req = http.expectOne(url);
      expect(req.request.headers.get('Authorization')).toBe('Bearer private-token');
      req.flush({});
    }
    for (const url of [
      'https://api.example.test/api/login',
      'https://api.example.test/api/register',
      'https://api.example.test/api/health',
      'https://external.example/api/me',
      'https://api.example.test/api-other/me',
    ]) {
      client.get(url).subscribe();
      const req = http.expectOne(url);
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush({});
    }
  });
  it('ends a protected session on 401 while preserving the HTTP failure', () => {
    const failed = jasmine.createSpy('failed');
    client.get('https://api.example.test/api/me').subscribe({ error: failed });
    http
      .expectOne('https://api.example.test/api/me')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(dispatch).toHaveBeenCalledWith(AuthActions.sessionExpired());
    expect(failed.calls.mostRecent().args[0]).toEqual(jasmine.any(HttpErrorResponse));
  });
  it('does not end a newer session because an older request returned 401', () => {
    client.get('https://api.example.test/api/me').subscribe({ error: () => {} });
    current = 'new-token';
    http
      .expectOne('https://api.example.test/api/me')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(dispatch).not.toHaveBeenCalled();
  });
  it('does not turn failed public login into session expiration', () => {
    client.post('https://api.example.test/api/login', {}).subscribe({ error: () => {} });
    http
      .expectOne('https://api.example.test/api/login')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(dispatch).not.toHaveBeenCalled();
  });
  it('does not end a new session because an earlier anonymous request returned 401', () => {
    current = null;
    client.get('https://api.example.test/api/me').subscribe({ error: () => {} });
    current = 'new-token';
    http
      .expectOne('https://api.example.test/api/me')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(dispatch).not.toHaveBeenCalled();
  });
});
