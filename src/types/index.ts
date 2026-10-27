// ─────────────────────────────────────────────────────────────────────────────
// Domain types for Agil Proyect Management Software - APMS
// ─────────────────────────────────────────────────────────────────────────────

export type UserRole = 'super_admin' | 'admin' | 'user';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  unit_id: number | null;
  unit_name: string | null;
  unit_color: string | null;
  unit_emoji: string | null;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

export interface Unit {
  id: number;
  name: string;
  description: string | null;
  color: string;
  emoji: string;
  created_at: string;
  project_count: number;
  user_count: number;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Project {
  id: number;
  name: string;
  description: string | null;
  unit_id: number;
  unit_name: string | null;
  unit_color: string | null;
  created_by: number | null;
  creator_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  task_count?: number;
}

export interface Task {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  responsible: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: number;
  user_id: number | null;
  user_name: string;
  user_email: string | null;
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  details: Record<string, unknown> | string | null;
  ip_address: string | null;
  timestamp?: string;
  created_at?: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthState {
  access_token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface TwoFAPayload {
  pending_token: string;
  code: string;
}

// ─── API response wrappers ────────────────────────────────────────────────────

export interface ApiError {
  error: string;
}

export interface PaginatedLogs {
  logs: ActivityLog[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    pages: number;
  };
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

export interface DashboardStats {
  total_users: number;
  total_units: number;
  total_projects: number;
  archived_projects: number;
  total_tasks: number;
  tasks_by_status: Record<TaskStatus, number>;
  tasks_by_priority: Record<TaskPriority, number>;
}

export interface UnitStat {
  id: number;
  name: string;
  color: string;
  active_projects: number;
  archived_projects: number;
  users: number;
}

export interface DashboardData {
  stats: DashboardStats;
  units: UnitStat[];
  recent_activity: ActivityLog[];
}

// ─── Form input types (used with Zod + RHF) ──────────────────────────────────

export interface CreateProjectInput {
  name: string;
  description?: string;
  unit_id?: number; // required for admin; auto-filled for user
}

export interface CreateTaskInput {
  project_id: number;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  responsible?: string;
  due_date?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  responsible?: string;
  due_date?: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  unit_id?: number;
}

export interface ChangePasswordInput {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export type WorkStatus =
  | 'planning'
  | 'in_progress'
  | 'paused'
  | 'completed'
  | 'cancelled';

export type WorkDocumentKind =
  | 'task_attachment'
  | 'start'
  | 'completion'
  | 'other';

export interface Work {
  id: number;
  unit_id: number;
  unit_name: string | null;
  unit_color: string | null;
  title: string;
  description: string | null;
  status: WorkStatus;
  progress: number;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  created_by: number | null;
  creator_name: string | null;
  created_at: string;
  updated_at: string;
  tasks_count: number;
  done_tasks_count: number;
  documents_count: number;
}

export interface WorkDocument {
  id: number;
  work_id: number;
  kind: WorkDocumentKind;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by: number | null;
  uploaded_by_name: string | null;
  uploaded_at: string;
  download_url: string;
}

export type WorkTaskStatus =
  | 'todo'
  | 'in_progress'
  | 'review'
  | 'blocked'
  | 'done';

export type WorkTaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface WorkTask {
  id: number;
  work_id: number;
  title: string;
  description: string | null;
  status: WorkTaskStatus;
  priority: WorkTaskPriority;
  responsible: string | null;
  due_date: string | null;
  progress: number;
  documents_count: number;
  created_at: string;
  updated_at: string;
}

export interface WorkTaskDocument {
  id: number;
  task_id: number;
  work_id: number;
  kind: WorkDocumentKind;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by: number | null;
  uploaded_by_name: string | null;
  uploaded_at: string;
  download_url: string;
}

export interface CreateWorkTaskInput {
  title: string;
  description?: string;
  status?: WorkTaskStatus;
  priority?: WorkTaskPriority;
  responsible?: string;
  due_date?: string;
  progress?: number;
}

export interface UpdateWorkTaskInput extends Partial<CreateWorkTaskInput> {}

export interface WorkKPIData {
  kpis: {
    total_tasks: number;
    done_tasks: number;
    completion_rate: number;
    avg_progress: number;
    documents_count: number;
  };
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
}

export interface CreateWorkInput {
  unit_id?: number;
  title: string;
  description?: string;
  status?: WorkStatus;
  progress?: number;
  location?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
}

export interface UpdateWorkInput extends Partial<CreateWorkInput> {}

export interface CreateUnitInput {
  name: string;
  description?: string;
  color?: string;
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Por hacer',
  in_progress: 'En progreso',
  review: 'En revisión',
  done: 'Completado',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#f97316',
  urgent: '#ef4444',
};

export const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: '#6366f1',
  in_progress: '#f59e0b',
  review: '#8b5cf6',
  done: '#22c55e',
};
