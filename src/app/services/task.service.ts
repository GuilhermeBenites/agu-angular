import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, timeout } from 'rxjs';
import { API_CONFIG, ApiConfig } from '../core/config/api-config';
import { Task, TaskInput, TaskPage } from '../core/api/task';

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function integer(value: unknown, min = 1, max = 2147483647): value is number {
  return Number.isInteger(value) && (value as number) >= min && (value as number) <= max;
}
function task(value: unknown): Task {
  const date = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
  if (
    !record(value) ||
    !integer(value['id']) ||
    typeof value['title'] !== 'string' ||
    !(value['description'] === null || typeof value['description'] === 'string') ||
    typeof value['createdAt'] !== 'string' ||
    !date.test(value['createdAt']) ||
    typeof value['updatedAt'] !== 'string' ||
    !date.test(value['updatedAt'])
  )
    throw new Error('Resposta de tarefa inválida.');
  return value as unknown as Task;
}
function taskPage(value: unknown): TaskPage {
  if (!record(value) || !Array.isArray(value['items']) || !record(value['pagination'])) {
    throw new Error('Resposta de paginação inválida.');
  }
  const p = value['pagination'];
  if (
    !integer(p['page']) ||
    !integer(p['limit'], 1, 100) ||
    !integer(p['total'], 0) ||
    !integer(p['totalPages'], 0) ||
    p['totalPages'] !== Math.ceil(p['total'] / p['limit']) ||
    value['items'].length > p['limit']
  )
    throw new Error('Resposta de paginação inválida.');
  return { items: value['items'].map(task), pagination: p as unknown as TaskPage['pagination'] };
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) private readonly config: ApiConfig,
  ) {}

  // Runtime configuration is loaded asynchronously before the first API call.
  list(page: number, limit: number): Observable<TaskPage> {
    return this.http
      .get<unknown>(`${this.config.apiBaseUrl}/tasks`, { params: { page, limit } })
      .pipe(timeout(10000), map(taskPage));
  }
  get(id: number): Observable<Task> {
    return this.http
      .get<unknown>(`${this.config.apiBaseUrl}/tasks/${id}`)
      .pipe(timeout(10000), map(task));
  }
  create(input: TaskInput): Observable<Task> {
    return this.http
      .post<unknown>(`${this.config.apiBaseUrl}/tasks`, input)
      .pipe(timeout(10000), map(task));
  }
  update(id: number, input: TaskInput): Observable<Task> {
    return this.http
      .put<unknown>(`${this.config.apiBaseUrl}/tasks/${id}`, input)
      .pipe(timeout(10000), map(task));
  }
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.config.apiBaseUrl}/tasks/${id}`).pipe(timeout(10000));
  }
}
