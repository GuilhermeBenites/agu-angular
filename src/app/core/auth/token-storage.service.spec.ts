import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TokenStorage, tokenExpiresAt } from './token-storage.service';
import { SessionExpiry } from './session-expiry.service';
export function testToken(seconds = 3600): string {
  return `e30.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + seconds }))}.signature`;
}
describe('Session token lifecycle', () => {
  afterEach(() => sessionStorage.removeItem('agu.access_token'));
  it('persists only in sessionStorage and can be restored by a new service', () => {
    const token = testToken();
    const storage = TestBed.inject(TokenStorage);
    storage.write(token);
    expect(storage.read()).toBe(token);
    expect(localStorage.getItem('agu.access_token')).toBeNull();
    storage.clear();
    expect(storage.read()).toBeNull();
  });
  it('rejects malformed tokens and absent/non-numeric expiration', () => {
    for (const token of [
      'invalid',
      'e30.e30.signature',
      'e30.' + btoa('{"exp":"tomorrow"}') + '.signature',
    ])
      expect(tokenExpiresAt(token)).toBeNull();
    expect(() => TestBed.inject(TokenStorage).write('invalid')).toThrow();
  });
  it('expires without HTTP and cancels an old session timer', fakeAsync(() => {
    const expiry = TestBed.inject(SessionExpiry);
    const expired = jasmine.createSpy('expired');
    expiry.expired$.subscribe(expired);
    expiry.schedule(testToken(1));
    expiry.schedule(testToken(10));
    tick(1500);
    expect(expired).not.toHaveBeenCalled();
    tick(9000);
    expect(expired).toHaveBeenCalledTimes(1);
    expiry.cancel();
  }));
  it('cancels expiration on logout', fakeAsync(() => {
    const expiry = TestBed.inject(SessionExpiry);
    const expired = jasmine.createSpy('expired');
    expiry.expired$.subscribe(expired);
    expiry.schedule(testToken(2));
    expiry.cancel();
    tick(5000);
    expect(expired).not.toHaveBeenCalled();
  }));
});
