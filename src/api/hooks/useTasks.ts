import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import api from '../axios';
import type { Task, CreateTaskInput, UpdateTaskInput, TaskStatus } from '../../types';

const QUERY_KEY = 'tasks';

// All cache keys use String(projectId) to avoid number/string mismatch
const taskKey = (projectId: number | string) => [QUERY_KEY, String(projectId)];

// â”€â”€â”€ Queries â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const useTasksByProject = (projectId: number | string | undefined) => {
  return useQuery<Task[]>({
    queryKey: taskKey(projectId ?? ''),
    queryFn: async () => {
      const { data } = await api.get<{ tasks: Task[] }>('/tasks', {
        params: { project_id: projectId },
      });
      return data.tasks;
    },
    enabled: !!projectId,
  });
};

export const useBoardData = (projectId: number | string | undefined) => {
  const tasksQuery = useTasksByProject(projectId);

  const grouped = {
    todo: (tasksQuery.data ?? []).filter((t) => t.status === 'todo'),
    in_progress: (tasksQuery.data ?? []).filter((t) => t.status === 'in_progress'),
    review: (tasksQuery.data ?? []).filter((t) => t.status === 'review'),
    done: (tasksQuery.data ?? []).filter((t) => t.status === 'done'),
  };

  return {
    tasks: tasksQuery.data ?? [],
    grouped,
    isLoading: tasksQuery.isLoading,
    isError: tasksQuery.isError,
    error: tasksQuery.error,
  };
};

// â”€â”€â”€ Mutations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const handleError = (error: unknown, fallback: string) => {
  const msg =
    (error as { response?: { data: { error?: string } } }).response?.data.error || fallback;
  toast.error(msg);
};

export const useCreateTask = () => {
  const qc = useQueryClient();
  return useMutation<Task, Error, CreateTaskInput>({
    mutationFn: async (payload) => {
      const { data } = await api.post<{ task: Task }>('/tasks', payload);
      return data.task;
    },
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: taskKey(task.project_id) });
      toast.success('Tarea creada con Ã©xito.');
    },
    onError: (e) => handleError(e, 'Error al crear tarea'),
  });
};

export const useUpdateTask = () => {
  const qc = useQueryClient();
  return useMutation<Task, Error, { taskId: number; updates: UpdateTaskInput }>({
    mutationFn: async ({ taskId, updates }) => {
      const { data } = await api.put<{ task: Task }>(`/tasks/${taskId}`, updates);
      return data.task;
    },
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: taskKey(task.project_id) });
    },
    onError: (e) => handleError(e, 'Error al actualizar tarea'),
  });
};

export const useUpdateTaskStatus = () => {
  const qc = useQueryClient();
  return useMutation<
    Task,
    Error,
    { taskId: number; newStatus: TaskStatus; projectId: number | string },
    { previous: Task[] | undefined }
  >({
    mutationFn: async ({ taskId, newStatus }) => {
      const { data } = await api.patch<{ task: Task }>(`/tasks/${taskId}/status`, {
        status: newStatus,
      });
      return data.task;
    },
    onMutate: async ({ taskId, newStatus, projectId }) => {
      const key = taskKey(projectId);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Task[]>(key);
      qc.setQueryData<Task[]>(key, (old = []) =>
        old.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      return { previous };
    },
    onError: (e, { projectId }, context) => {
      if (context?.previous) {
        qc.setQueryData(taskKey(projectId), context.previous);
      }
      handleError(e, 'Error al mover tarea');
    },
    onSettled: (_task, _err, { projectId }) => {
      qc.invalidateQueries({ queryKey: taskKey(projectId) });
    },
  });
};

export const useDeleteTask = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, { taskId: number; projectId: number }>({
    mutationFn: async ({ taskId }) => {
      await api.delete(`/tasks/${taskId}`);
    },
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: taskKey(projectId) });
      toast.success('Tarea eliminada.');
    },
    onError: (e) => handleError(e, 'Error al eliminar tarea'),
  });
};


