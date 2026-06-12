import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth';
import { vi } from 'vitest';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  const routerNavigate = vi.fn();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: { navigate: routerNavigate } },
      ],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    localStorage.clear();
    routerNavigate.mockClear();
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('login success sets session and token signal', () => {
    const mockResp = {
      success: true, message: 'OK',
      data: { token: 'jwt123', userId: 'u1', name: 'Alice', email: 'alice@test.com', role: 'STUDENT' },
    };

    service.login('alice@test.com', 'pass').subscribe();
    http.expectOne('/api/auth/login').flush(mockResp);

    expect(service.token()).toBe('jwt123');
    expect(service.isLoggedIn()).toBe(true);
    expect(service.user()?.name).toBe('Alice');
  });

  it('login failure does not set token', () => {
    const mockResp = { success: false, message: 'Identifiants invalides', data: null };

    service.login('bad@test.com', 'wrong').subscribe();
    http.expectOne('/api/auth/login').flush(mockResp);

    expect(service.token()).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
  });

  it('logout clears token and navigates to login', () => {
    localStorage.setItem('eduai_token', 'abc');
    localStorage.setItem('eduai_user', JSON.stringify({ id: '1', name: 'Bob', email: 'b@b.com', role: 'STUDENT' }));

    service.logout();

    expect(service.token()).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
    expect(routerNavigate).toHaveBeenCalledWith(['/login']);
  });

  it('register calls correct endpoint with role', () => {
    const mockResp = {
      success: true, message: 'Créé',
      data: { token: 'tok', userId: 'u2', name: 'Bob', email: 'bob@test.com', role: 'TRAINER' },
    };

    service.register('Bob', 'bob@test.com', 'pass', 'TRAINER').subscribe();
    const req = http.expectOne('/api/auth/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.role).toBe('TRAINER');
    req.flush(mockResp);
  });

  it('role signal returns null when not logged in', () => {
    expect(service.role()).toBeNull();
  });

  it('role signal returns correct role after login', () => {
    const mockResp = {
      success: true, message: 'OK',
      data: { token: 't', userId: 'u', name: 'Admin', email: 'a@a.com', role: 'ADMIN' },
    };
    service.login('a@a.com', 'pass').subscribe();
    http.expectOne('/api/auth/login').flush(mockResp);
    expect(service.role()).toBe('ADMIN');
  });
});
