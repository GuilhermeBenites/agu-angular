import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Credentials } from './auth.models';

// Credentials travel only in these transient streams, never in Store actions or state.
@Injectable({ providedIn: 'root' })
export class AuthCommands {
  private readonly loginRequests = new Subject<Credentials>();
  private readonly registrationRequests = new Subject<Credentials>();
  readonly login$ = this.loginRequests.asObservable();
  readonly register$ = this.registrationRequests.asObservable();
  login(credentials: Credentials): void {
    this.loginRequests.next(credentials);
  }
  register(credentials: Credentials): void {
    this.registrationRequests.next(credentials);
  }
}
