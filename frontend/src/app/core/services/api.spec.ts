import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api';

describe('ApiService', () => {
  let service: ApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService],
    });
    service = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => expect(service).toBeTruthy());

  it('get() unwraps data from ApiResponse envelope', () => {
    let result: any;
    service.get<{ name: string }>('/courses').subscribe(d => (result = d));

    const req = http.expectOne('/api/courses');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, message: 'OK', data: { name: 'Angular' } });

    expect(result).toEqual({ name: 'Angular' });
  });

  it('post() sends JSON body and unwraps data', () => {
    let result: any;
    service.post<{ id: string }>('/courses', { title: 'Test' }).subscribe(d => (result = d));

    const req = http.expectOne('/api/courses');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.title).toBe('Test');
    req.flush({ success: true, message: 'Créé', data: { id: 'abc' } });

    expect(result).toEqual({ id: 'abc' });
  });

  it('put() sends PUT method', () => {
    service.put('/courses/1', { title: 'Modifié' }).subscribe();
    const req = http.expectOne('/api/courses/1');
    expect(req.request.method).toBe('PUT');
    req.flush({ success: true, message: 'OK', data: {} });
  });

  it('delete() sends DELETE and unwraps data', () => {
    let result: any;
    service.delete('/courses/1').subscribe(d => (result = d));
    const req = http.expectOne('/api/courses/1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, message: 'Supprimé', data: null });
    expect(result).toBeNull();
  });

  it('patch() sends PATCH method', () => {
    service.patch('/users/1', { active: false }).subscribe();
    const req = http.expectOne('/api/users/1');
    expect(req.request.method).toBe('PATCH');
    req.flush({ success: true, message: 'OK', data: {} });
  });
});
