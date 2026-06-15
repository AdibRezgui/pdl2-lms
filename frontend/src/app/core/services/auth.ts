import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { User } from '../models';

interface AuthResponse {
  token: string; refreshToken?: string; userId: string; name: string;
  email: string; role: string; avatar?: string;
}
interface ApiResp<T> { success: boolean; message: string; data: T }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY   = 'eduai_token';
  private readonly REFRESH_KEY = 'eduai_refresh_token';
  private readonly USER_KEY    = 'eduai_user';

  private _token = signal<string | null>(localStorage.getItem(this.TOKEN_KEY));
  private _user  = signal<User | null>(this.loadUser());

  readonly token      = this._token.asReadonly();
  readonly user       = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token());
  readonly role       = computed(() => this._user()?.role ?? null);

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<ApiResp<AuthResponse>> {
    return this.http.post<ApiResp<AuthResponse>>('/api/auth/login', { email, password }).pipe(
      tap(res => { if (res.success) this.setSession(res.data); })
    );
  }

  register(name: string, email: string, password: string, role: string): Observable<ApiResp<AuthResponse>> {
    return this.http.post<ApiResp<AuthResponse>>('/api/auth/register', { name, email, password, role }).pipe(
      tap(res => { if (res.success) this.setSession(res.data); })
    );
  }

  refreshToken(): Observable<ApiResp<AuthResponse>> {
    const refreshToken = localStorage.getItem(this.REFRESH_KEY);
    return this.http.post<ApiResp<AuthResponse>>('/api/auth/refresh', { refreshToken }).pipe(
      tap(res => { if (res.success) this.setSession(res.data); })
    );
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_KEY);
  }

  logout() {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  clearSession() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._token.set(null);
    this._user.set(null);
  }

  updateLocalUser(patch: Partial<User>) {
    const merged = { ...this._user(), ...patch } as User;
    localStorage.setItem(this.USER_KEY, JSON.stringify(merged));
    this._user.set(merged);
  }

  private setSession(data: AuthResponse) {
    const user: User = { id: data.userId, name: data.name, email: data.email, role: data.role as User['role'], avatar: data.avatar };
    localStorage.setItem(this.TOKEN_KEY, data.token);
    if (data.refreshToken) localStorage.setItem(this.REFRESH_KEY, data.refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this._token.set(data.token); this._user.set(user);
  }

  private loadUser(): User | null {
    try { const r = localStorage.getItem(this.USER_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
  }
}
