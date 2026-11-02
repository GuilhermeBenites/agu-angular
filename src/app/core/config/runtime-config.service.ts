import { DOCUMENT } from '@angular/common';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiConfig } from './api-config';

@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  private readonly http: HttpClient;
  private config?: ApiConfig;

  constructor(
    backend: HttpBackend,
    @Inject(DOCUMENT) private readonly document: Document,
  ) {
    this.http = new HttpClient(backend);
  }

  get value(): ApiConfig {
    if (!this.config) {
      throw new Error('Runtime configuration has not loaded.');
    }
    return this.config;
  }

  async load(): Promise<void> {
    const url = new URL('assets/config.json', this.document.baseURI).href;
    const raw = await firstValueFrom(this.http.get<unknown>(url));
    if (
      typeof raw !== 'object' ||
      raw === null ||
      !('apiBaseUrl' in raw) ||
      typeof raw.apiBaseUrl !== 'string'
    ) {
      throw new Error('Invalid API configuration.');
    }
    const apiUrl = new URL(raw.apiBaseUrl);
    if (
      !['http:', 'https:'].includes(apiUrl.protocol) ||
      apiUrl.username ||
      apiUrl.password ||
      apiUrl.search ||
      apiUrl.hash
    ) {
      throw new Error('Invalid API URL.');
    }
    this.config = Object.freeze({ apiBaseUrl: apiUrl.href.replace(/\/$/, '') });
  }
}
