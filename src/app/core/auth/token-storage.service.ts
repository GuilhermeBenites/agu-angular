import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';

export function tokenExpiresAt(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload: unknown = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (
      typeof payload !== 'object' ||
      payload === null ||
      !('exp' in payload) ||
      typeof payload.exp !== 'number' ||
      !Number.isFinite(payload.exp)
    )
      return null;
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class TokenStorage {
  private readonly key = 'agu.access_token';
  constructor(@Inject(DOCUMENT) private readonly document: Document) {}
  read(): string | null {
    try {
      return this.document.defaultView?.sessionStorage.getItem(this.key) ?? null;
    } catch {
      return null;
    }
  }
  write(token: string): void {
    if (tokenExpiresAt(token) === null) throw new Error('Invalid session token.');
    const storage = this.document.defaultView?.sessionStorage;
    if (!storage) throw new Error('Session storage unavailable.');
    storage.setItem(this.key, token);
  }
  clear(): void {
    try {
      this.document.defaultView?.sessionStorage.removeItem(this.key);
    } catch {
      /* Storage may be unavailable. */
    }
  }
}
