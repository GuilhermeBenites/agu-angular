import { Task, TaskPage } from '../app/core/api/task';
export const exampleTask: Task = {
  id: 42,
  title: 'Revisar contrato',
  description: null,
  createdAt: '2026-10-30T14:00:00Z',
  updatedAt: '2026-10-30T14:00:00Z',
};
export const exampleTaskPage: TaskPage = {
  items: [exampleTask],
  pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
};
