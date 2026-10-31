import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { tokenExpiresAt } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class SessionExpiry implements OnDestroy {
  private timer?: ReturnType<typeof setTimeout>;
  private readonly expired = new Subject<void>();
  readonly expired$ = this.expired.asObservable();
  schedule(token: string): void {
    this.cancel();
    const expiresAt = tokenExpiresAt(token);
    if (expiresAt === null) {
      this.expired.next();
      return;
    }
    const remaining = expiresAt - Date.now();
    this.timer = setTimeout(
      () => {
        if (Date.now() >= expiresAt) this.expired.next();
        else this.schedule(token);
      },
      Math.max(0, Math.min(remaining, 2147483647)),
    );
  }
  cancel(): void {
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined;
  }
  ngOnDestroy(): void {
    this.cancel();
    this.expired.complete();
  }
}
