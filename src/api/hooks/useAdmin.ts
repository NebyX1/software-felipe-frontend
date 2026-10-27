import { useQuery } from '@tanstack/react-query';
import api from '../axios';
import type { DashboardData, PaginatedLogs } from '../../types';

export const useDashboard = () => {
  return useQuery<DashboardData>({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      const { data } = await api.get<DashboardData>('/admin/dashboard');
      return data;
    },
  });
};

export const useDashboardFiltered = (params?: { unit_id?: number }) => {
  return useQuery<DashboardData>({
    queryKey: ['admin', 'dashboard', params],
    queryFn: async () => {
      const { data } = await api.get<DashboardData>('/admin/dashboard', { params });
      return data;
    },
  });
};

export const useActivityLogs = (params?: {
  page?: number;
  per_page?: number;
  action?: string;
  user_id?: number;
  entity_type?: string;
  date_from?: string;
  date_to?: string;
}) => {
  return useQuery<PaginatedLogs>({
    queryKey: ['admin', 'logs', params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedLogs>('/admin/logs', { params });
      return data;
    },
  });
};

export const useExportProjects = () => {
  const exportProjects = async (params?: {
    unit_id?: number;
    archived?: string;
    date_from?: string;
    date_to?: string;
  }) => {
    const resp = await api.get('/admin/export/projects', {
      params,
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([resp.data as BlobPart]));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'proyectos.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };
  return { exportProjects };
};

export const useExportTasks = () => {
  const exportTasks = async (params?: {
    project_id?: number;
    unit_id?: number;
    status?: string;
    priority?: string;
    date_from?: string;
    date_to?: string;
  }) => {
    const resp = await api.get('/admin/export/tasks', {
      params,
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([resp.data as BlobPart]));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tareas.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };
  return { exportTasks };
};


