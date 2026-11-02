import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { appConfig } from './app.config';
import { API_CONFIG } from './core/config/api-config';

describe('Application initialization', () => {
  it('provides the configured API URL only after the initializer resolves', async () => {
    TestBed.configureTestingModule({
      providers: [...appConfig.providers, provideHttpClientTesting()],
    });
    const initialization = TestBed.inject(ApplicationInitStatus);
    const http = TestBed.inject(HttpTestingController);
    http
      .expectOne((request) => request.url.endsWith('/assets/config.json'))
      .flush({ apiBaseUrl: 'https://configured.example/api' });
    await initialization.donePromise;
    expect(TestBed.inject(API_CONFIG).apiBaseUrl).toBe('https://configured.example/api');
    http.verify();
  });
});
