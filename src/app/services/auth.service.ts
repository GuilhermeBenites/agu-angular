import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { map, Observable, timeout } from 'rxjs';
import { API_CONFIG, ApiConfig } from '../core/config/api-config';
import { LoginResponse, User } from '../core/auth/auth.models';

function userResponse(raw: unknown): User {
  if (
    typeof raw !== 'object' ||
    raw === null ||
    !('id' in raw) ||
    !Number.isInteger(raw.id) ||
    Number(raw.id) <= 0 ||
    Number(raw.id) > 2147483647 ||
    !('username' in raw) ||
    typeof raw.username !== 'string' ||
    !/^[a-z0-9][a-z0-9._-]{2,49}$/.test(raw.username)
  )
    throw new Error('Invalid user response.');
  return { id: Number(raw.id), username: raw.username };
}
@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) private readonly config: ApiConfig,
  ) {}
  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<unknown>(`${this.config.apiBaseUrl}/login`, { username, password }).pipe(
      timeout(10000),
      map((raw) => {
        if (
          typeof raw !== 'object' ||
          raw === null ||
          !('token' in raw) ||
          typeof raw.token !== 'string' ||
          !('tokenType' in raw) ||
          raw.tokenType !== 'Bearer' ||
          !('expiresIn' in raw) ||
          typeof raw.expiresIn !== 'number' ||
          !Number.isInteger(raw.expiresIn) ||
          raw.expiresIn <= 0 ||
          !('user' in raw)
        )
          throw new Error('Invalid login response.');
        return {
          token: raw.token,
          tokenType: 'Bearer' as const,
          expiresIn: raw.expiresIn,
          user: userResponse(raw.user),
        };
      }),
    );
  }
  register(username: string, password: string): Observable<User> {
    return this.http
      .post<unknown>(`${this.config.apiBaseUrl}/register`, { username, password })
      .pipe(timeout(10000), map(userResponse));
  }
  me(): Observable<User> {
    return this.http
      .get<unknown>(`${this.config.apiBaseUrl}/me`)
      .pipe(timeout(10000), map(userResponse));
  }
}
