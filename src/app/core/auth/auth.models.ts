export interface Credentials {
  username: string;
  password: string;
}
export interface User {
  id: number;
  username: string;
}
export interface LoginResponse {
  token: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: User;
}
export interface ApiFailure {
  code: string;
  message: string;
  details: { field: string; message: string }[];
  requestId?: string;
}
export type SessionStatus = 'checking' | 'anonymous' | 'authenticated' | 'unavailable';
