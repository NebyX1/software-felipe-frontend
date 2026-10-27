import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import api from '../axios';
import type {
  Work,
  WorkDocument,
  CreateWorkInput,
  UpdateWorkInput,
  WorkDocumentKind,
  WorkTask,
  WorkTaskDocument,
  CreateWorkTaskInput,
  UpdateWorkTaskInput,
  WorkKPIData,
} from '../../types';

const WORKS_KEY = 'works';
const WORK_DOCS_KEY = 'work-docs';
const WORK_TASKS_KEY = 'work-tasks';
const WORK_TASK_DOCS_KEY = 'work-task-docs';
const WORK_KPIS_KEY = 'work-kpis';

type ApiErrorShape = {
  response?: {
    data?: {
      error?: string;
    };
  };
};

const getApiError = (error: unknown, fallback: string): string => {
  const msg = (error as ApiErrorShape).response?.data?.error;
  return msg || fallback;
};

export const useWorks = (unitId?: number) => {
  return useQuery<Work[]>({
    queryKey: [WORKS_KEY, unitId ?? null],
    queryFn: async () => {
      const { data } = await api.get<{ works: Work[] }>('/works', {
        params: unitId ? { unit_id: unitId } : {},
      });
      return data.works;
    },
  });
};

export const useCreateWork = () => {
  const qc = useQueryClient();
  return useMutation<Work, Error, CreateWorkInput>({
    mutationFn: async (payload) => {
      const { data } = await api.post<{ work: Work }>('/works', payload);
      return data.work;
    },
    onSuccess: (work) => {
      qc.invalidateQueries({ queryKey: [WORKS_KEY] });
      qc.invalidateQueries({ queryKey: [WORKS_KEY, work.unit_id] });
      toast.success('Obra creada.');
    },
    onError: (error: unknown) => {
      toast.error(getApiError(error, 'No se pudo crear la obra'));
    },
  });
};

export const useUpdateWork = () => {
  const qc = useQueryClient();
  return useMutation<Work, Error, { id: number; data: UpdateWorkInput }>({
    mutationFn: async ({ id, data: payload }) => {
      const { data } = await api.put<{ work: Work }>(`/works/${id}`, payload);
      return data.work;
    },
    onSuccess: (work) => {
      qc.invalidateQueries({ queryKey: [WORKS_KEY] });
      qc.invalidateQueries({ queryKey: [WORKS_KEY, work.unit_id] });
      qc.invalidateQueries({ queryKey: [WORK_KPIS_KEY, work.id] });
      toast.success('Obra actualizada.');
    },
    onError: (error: unknown) => {
      toast.error(getApiError(error, 'No se pudo actualizar la obra'));
    },
  });
};

export const useDeleteWork = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await api.delete(`/works/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [WORKS_KEY] });
      toast.success('Obra eliminada.');
    },
    onError: (error: unknown) => {
      toast.error(getApiError(error, 'No se pudo eliminar la obra'));
    },
  });
};

export const useWorkDocuments = (workId?: number) => {
  return useQuery<WorkDocument[]>({
    queryKey: [WORK_DOCS_KEY, workId ?? null],
    queryFn: async () => {
      const { data } = await api.get<{ documents: WorkDocument[] }>(
        `/works/${workId}/documents`
      );
      return data.documents;
    },
    enabled: !!workId,
  });
};

export const useUploadWorkDocument = () => {
  const qc = useQueryClient();

  return useMutation<
    WorkDocument,
    Error,
    { workId: number; file: File; kind: WorkDocumentKind; uploadType?: 'document' | 'image' }
  >({
    mutationFn: async ({ workId, file, kind, uploadType = 'document' }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('kind', kind);
      formData.append('upload_type', uploadType);

      const { data } = await api.post<{ document: WorkDocument }>(
        `/works/${workId}/documents`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      return data.document;
    },
    onSuccess: (doc) => {
      qc.invalidateQueries({ queryKey: [WORK_DOCS_KEY, doc.work_id] });
      qc.invalidateQueries({ queryKey: [WORKS_KEY] });
      toast.success('Documento subido.');
    },
    onError: (error: unknown) => {
      toast.error(getApiError(error, 'No se pudo subir el documento'));
    },
  });
};

export const useWorkTasks = (workId?: number) => {
  return useQuery<WorkTask[]>({
    queryKey: [WORK_TASKS_KEY, workId ?? null],
    queryFn: async () => {
      const { data } = await api.get<{ tasks: WorkTask[] }>(`/works/${workId}/tasks`);
      return data.tasks;
    },
    enabled: !!workId,
  });
};

export const useCreateWorkTask = () => {
  const qc = useQueryClient();
  return useMutation<WorkTask, Error, { workId: number; payload: CreateWorkTaskInput }>({
    mutationFn: async ({ workId, payload }) => {
      const { data } = await api.post<{ task: WorkTask }>(`/works/${workId}/tasks`, payload);
      return data.task;
    },
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: [WORK_TASKS_KEY, task.work_id] });
      qc.invalidateQueries({ queryKey: [WORKS_KEY] });
      qc.invalidateQueries({ queryKey: [WORK_KPIS_KEY, task.work_id] });
      toast.success('Tarea de obra creada.');
    },
    onError: (error: unknown) => {
      toast.error(getApiError(error, 'No se pudo crear la tarea'));
    },
  });
};

export const useUpdateWorkTask = () => {
  const qc = useQueryClient();
  return useMutation<
    WorkTask,
    Error,
    { workId: number; taskId: number; payload: UpdateWorkTaskInput }
  >({
    mutationFn: async ({ workId, taskId, payload }) => {
      const { data } = await api.put<{ task: WorkTask }>(
        `/works/${workId}/tasks/${taskId}`,
        payload
      );
      return data.task;
    },
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: [WORK_TASKS_KEY, task.work_id] });
      qc.invalidateQueries({ queryKey: [WORK_KPIS_KEY, task.work_id] });
      toast.success('Tarea de obra actualizada.');
    },
    onError: (error: unknown) => {
      toast.error(getApiError(error, 'No se pudo actualizar la tarea'));
    },
  });
};

export const useDeleteWorkTask = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, { workId: number; taskId: number }>({
    mutationFn: async ({ workId, taskId }) => {
      await api.delete(`/works/${workId}/tasks/${taskId}`);
    },
    onSuccess: (_, { workId }) => {
      qc.invalidateQueries({ queryKey: [WORK_TASKS_KEY, workId] });
      qc.invalidateQueries({ queryKey: [WORK_KPIS_KEY, workId] });
      qc.invalidateQueries({ queryKey: [WORKS_KEY] });
      toast.success('Tarea de obra eliminada.');
    },
    onError: (error: unknown) => {
      toast.error(getApiError(error, 'No se pudo eliminar la tarea'));
    },
  });
};

export const useWorkTaskDocuments = (workId?: number, taskId?: number) => {
  return useQuery<WorkTaskDocument[]>({
    queryKey: [WORK_TASK_DOCS_KEY, workId ?? null, taskId ?? null],
    queryFn: async () => {
      const { data } = await api.get<{ documents: WorkTaskDocument[] }>(
        `/works/${workId}/tasks/${taskId}/documents`
      );
      return data.documents;
    },
    enabled: !!workId && !!taskId,
  });
};

export const useUploadWorkTaskDocument = () => {
  const qc = useQueryClient();

  return useMutation<
    WorkTaskDocument,
    Error,
    {
      workId: number;
      taskId: number;
      file: File;
      kind: WorkDocumentKind;
      uploadType?: 'document' | 'image';
    }
  >({
    mutationFn: async ({ workId, taskId, file, kind, uploadType = 'document' }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('kind', kind);
      formData.append('upload_type', uploadType);

      const { data } = await api.post<{ document: WorkTaskDocument }>(
        `/works/${workId}/tasks/${taskId}/documents`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      return data.document;
    },
    onSuccess: (doc) => {
      qc.invalidateQueries({
        queryKey: [WORK_TASK_DOCS_KEY, doc.work_id, doc.task_id],
      });
      qc.invalidateQueries({ queryKey: [WORK_TASKS_KEY, doc.work_id] });
      qc.invalidateQueries({ queryKey: [WORK_KPIS_KEY, doc.work_id] });
      toast.success('Documento de tarea subido.');
    },
    onError: (error: unknown) => {
      toast.error(getApiError(error, 'No se pudo subir el documento de tarea'));
    },
  });
};

export const useWorkKpis = (workId?: number) => {
  return useQuery<WorkKPIData>({
    queryKey: [WORK_KPIS_KEY, workId ?? null],
    queryFn: async () => {
      const { data } = await api.get<WorkKPIData>(`/works/${workId}/kpis`);
      return data;
    },
    enabled: !!workId,
  });
};
