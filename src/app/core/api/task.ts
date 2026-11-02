export interface Task {
  id: number;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface TaskInput {
  title: string;
  description: string | null;
}
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
export interface TaskPage {
  items: Task[];
  pagination: Pagination;
}
