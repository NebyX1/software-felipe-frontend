import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import api from '../axios';
import type { Project, CreateProjectInput } from '../../types';

const QUERY_KEY = 'projects';

// â”€â”€â”€ Queries â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const useProjects = (archived = false, unitId?: number) => {
  return useQuery<Project[]>({
    queryKey: [QUERY_KEY, { archived, unitId: unitId ?? null }],
    queryFn: async () => {
      const { data } = await api.get<{ projects: Project[] }>('/projects', {
        params: {
          archived: archived ? 'true' : 'false',
          ...(unitId ? { unit_id: unitId } : {}),
        },
      });
      return data.projects;
    },
  });
};

export const useProjectById = (id: number | string | undefined) => {
  return useQuery<Project>({
    queryKey: [QUERY_KEY, id],
    queryFn: async () => {
      const { data } = await api.get<{ project: Project }>(`/projects/${id}`);
      return data.project;
    },
    enabled: !!id,
  });
};

// â”€â”€â”€ Mutations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const useCreateProject = () => {
  const qc = useQueryClient();
  return useMutation<Project, Error, CreateProjectInput>({
    mutationFn: async (payload) => {
      const { data } = await api.post<{ project: Project }>('/projects', payload);
      return data.project;
    },
    onSuccess: (project) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success(`Proyecto "${project.name}" creado con Ã©xito.`);
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data: { error?: string } } }).response?.data.error ||
        'Error al crear proyecto';
      toast.error(msg);
    },
  });
};

export const useUpdateProject = () => {
  const qc = useQueryClient();
  return useMutation<Project, Error, { id: number; data: Partial<CreateProjectInput & { is_active: boolean }> }>({
    mutationFn: async ({ id, data: payload }) => {
      const { data } = await api.put<{ project: Project }>(`/projects/${id}`, payload);
      return data.project;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data: { error?: string } } }).response?.data.error ||
        'Error al actualizar proyecto';
      toast.error(msg);
    },
  });
};

export const useArchiveProject = () => {
  const update = useUpdateProject();
  return {
    ...update,
    mutate: (id: number, options?: Parameters<typeof update.mutate>[1]) =>
      update.mutate({ id, data: { is_active: false } }, options),
    mutateAsync: (id: number) =>
      update.mutateAsync({ id, data: { is_active: false } }),
  };
};

export const useDeleteProject = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await api.delete(`/projects/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Proyecto eliminado.');
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data: { error?: string } } }).response?.data.error ||
        'Error al eliminar proyecto';
      toast.error(msg);
    },
  });
};


