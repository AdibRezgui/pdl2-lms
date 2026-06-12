import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AdminCourses } from './courses';
import { ApiService } from '../../../core/services/api';
import { AuthService } from '../../../core/services/auth';
import { ToastService } from '../../../core/services/toast';
import { of } from 'rxjs';
import { vi } from 'vitest';

describe('AdminCourses', () => {
  let component: AdminCourses;
  let fixture: ComponentFixture<AdminCourses>;
  let http: HttpTestingController;

  const mockCourses = [
    { id: '1', title: 'Cours A', status: 'PENDING_REVIEW', trainerName: 'Alice', category: 'IT', published: false, description: '', level: '', studentsCount: 0, createdAt: '' },
    { id: '2', title: 'Cours B', status: 'APPROVED', trainerName: 'Bob', category: 'Design', published: true, description: '', level: '', studentsCount: 5, createdAt: '' },
  ];

  const authMock = {
    user: () => ({ name: 'Admin', role: 'ADMIN' }),
    role: () => 'ADMIN',
  };

  const toastMock = { success: vi.fn(), error: vi.fn() };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCourses, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authMock },
        { provide: ToastService, useValue: toastMock },
        ApiService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminCourses);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);

    fixture.detectChanges();
    http.expectOne('/api/admin/courses').flush(mockCourses);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('should create', () => expect(component).toBeTruthy());

  it('loads all courses on init', () => {
    expect(component.courses().length).toBe(2);
    expect(component.loading()).toBe(false);
  });

  it('filteredCourses() with PENDING_REVIEW shows only pending', () => {
    component.activeFilter.set('PENDING_REVIEW');
    const filtered = component.filteredCourses();
    expect(filtered.every(c => c.status === 'PENDING_REVIEW')).toBe(true);
    expect(filtered.length).toBe(1);
  });

  it('filteredCourses() with ALL shows all courses', () => {
    component.activeFilter.set('ALL');
    expect(component.filteredCourses().length).toBe(2);
  });

  it('pendingCount() returns correct number', () => {
    expect(component.pendingCount()).toBe(1);
  });

  it('approve() calls PUT /admin/courses/:id/approve', () => {
    component.approve(mockCourses[0] as any);
    const req = http.expectOne('/api/admin/courses/1/approve');
    expect(req.request.method).toBe('PUT');
    req.flush({ id: '1', status: 'APPROVED', published: true });
  });

  it('openReject() sets rejectTarget', () => {
    component.openReject(mockCourses[0] as any);
    expect(component.rejectTarget()?.id).toBe('1');
  });

  it('closeReject() clears rejectTarget', () => {
    component.openReject(mockCourses[0] as any);
    component.closeReject();
    expect(component.rejectTarget()).toBeNull();
  });

  it('statusLabel() returns French label', () => {
    expect(component.statusLabel('PENDING_REVIEW')).toBe('En attente');
    expect(component.statusLabel('APPROVED')).toBe('Approuvé');
    expect(component.statusLabel('REJECTED')).toBe('Rejeté');
    expect(component.statusLabel('DRAFT')).toBe('Brouillon');
  });
});
