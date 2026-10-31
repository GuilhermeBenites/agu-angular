import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { RuntimeConfigService } from './runtime-config.service';

describe('RuntimeConfigService', () => {
  let service: RuntimeConfigService;
  let http: HttpTestingController;
  let configUrl: string;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RuntimeConfigService);
    http = TestBed.inject(HttpTestingController);
    configUrl = new URL('assets/config.json', TestBed.inject(DOCUMENT).baseURI).href;
  });

  afterEach(() => http.verify());

  it('loads and normalizes the API URL before consumers use it', async () => {
    expect(() => service.value).toThrow();
    const loaded = service.load();
    http.expectOne(configUrl).flush({ apiBaseUrl: 'https://api.example.test/api/' });
    await loaded;
    expect(service.value.apiBaseUrl).toBe('https://api.example.test/api');
    expect(Object.isFrozen(service.value)).toBeTrue();
  });

  for (const invalid of [
    {},
    null,
    { apiBaseUrl: 123 },
    { apiBaseUrl: 'javascript:alert(1)' },
    { apiBaseUrl: 'https://user:secret@api.example.test/api' },
    { apiBaseUrl: 'https://api.example.test/api?token=secret' },
    { apiBaseUrl: 'https://api.example.test/api#fragment' },
  ]) {
    it(`rejects invalid configuration ${JSON.stringify(invalid)}`, async () => {
      const loaded = service.load();
      const rejected = expectAsync(loaded).toBeRejected();
      http.expectOne(configUrl).flush(invalid);
      await rejected;
      expect(() => service.value).toThrow();
    });
  }

  it('fails initialization when the config file is unavailable', async () => {
    const loaded = service.load();
    const rejected = expectAsync(loaded).toBeRejected();
    http.expectOne(configUrl).flush('Unavailable', { status: 503, statusText: 'Unavailable' });
    await rejected;
  });
});
