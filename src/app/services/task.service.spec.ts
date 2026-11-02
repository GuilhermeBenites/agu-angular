import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { provideFoundationTesting, TEST_API_URL } from '../../testing/test-providers';
import { exampleTask, exampleTaskPage } from '../../testing/tasks';
import { TaskService } from './task.service';

describe('Tasks HTTP contract', () => {
  let api: TaskService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideFoundationTesting() });
    api = TestBed.inject(TaskService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('requests the selected page and limit', () => {
    api.list(2, 10).subscribe((result) => expect(result.items).toEqual([exampleTask]));
    const request = http.expectOne(`${TEST_API_URL}/tasks?page=2&limit=10`);
    expect(request.request.method).toBe('GET');
    request.flush({
      ...exampleTaskPage,
      pagination: { page: 2, limit: 10, total: 11, totalPages: 2 },
    });
  });
  it('gets a task by ID for direct edit URLs', () => {
    api.get(42).subscribe((task) => expect(task).toEqual(exampleTask));
    http.expectOne(`${TEST_API_URL}/tasks/42`).flush(exampleTask);
  });
  it('creates and replaces only editable fields, preserving raw limits for validation', () => {
    const input = { title: ' Título ', description: null };
    api.create(input).subscribe();
    const post = http.expectOne(`${TEST_API_URL}/tasks`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual(input);
    post.flush(exampleTask);
    api.update(42, input).subscribe();
    const put = http.expectOne(`${TEST_API_URL}/tasks/42`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual(input);
    put.flush(exampleTask);
  });
  it('deletes without requiring a response body', () => {
    const done = jasmine.createSpy();
    api.delete(42).subscribe(done);
    const request = http.expectOne(`${TEST_API_URL}/tasks/42`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
    expect(done).toHaveBeenCalled();
  });
  it('preserves HTTP failures for centralized handling', () => {
    const failed = jasmine.createSpy();
    api.get(42).subscribe({ error: failed });
    http.expectOne(`${TEST_API_URL}/tasks/42`).flush({}, { status: 404, statusText: 'Not Found' });
    expect(failed).toHaveBeenCalled();
  });
  it('rejects malformed task and pagination responses', () => {
    for (const invalid of [
      {},
      { ...exampleTaskPage, pagination: { page: 0, limit: 20, total: 1, totalPages: 1 } },
      { ...exampleTaskPage, items: [{ ...exampleTask, id: '42' }] },
    ]) {
      const failed = jasmine.createSpy();
      api.list(1, 20).subscribe({ error: failed });
      http.expectOne(`${TEST_API_URL}/tasks?page=1&limit=20`).flush(invalid);
      expect(failed).toHaveBeenCalled();
    }
  });
});
