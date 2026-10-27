import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import api from '../axios';
import type { User } from '../../types';
import type { CreateUserSchema } from '../../schemas';

const QUERY_KEY = 'users';

type ApiErrorShape = {
  response?: {
    data?: {
      error?: string;
    };
  };
};

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  const message = (error as ApiErrorShape).response?.data?.error;
  return message || fallback;
};

export const useUsers = (filters?: { unit_id?: number; role?: string }) => {
  return useQuery<User[]>({
    queryKey: [QUERY_KEY, filters],
    queryFn: async () => {
      const { data } = await api.get<{ users: User[] }>('/users', { params: filters });
      return data.users;
    },
  });
};

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useMutation<User, Error, CreateUserSchema>({
    mutationFn: async (payload) => {
      const { data } = await api.post<{ user: User }>('/users', payload);
      return data.user;
    },
    onSuccess: (user) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success(`Usuario "${user.name}" creado.`);
    },
    onError: (error: unknown) => {
      const msg = getApiErrorMessage(error, 'Error al crear usuario');
      toast.error(msg);
    },
  });
};

export const useUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation<User, Error, { id: number; data: Partial<CreateUserSchema & { is_active: boolean }> }>({
    mutationFn: async ({ id, data: payload }) => {
      const { data } = await api.put<{ user: User }>(`/users/${id}`, payload);
      return data.user;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Usuario actualizado.');
    },
    onError: (error: unknown) => {
      const msg = getApiErrorMessage(error, 'Error al actualizar usuario');
      toast.error(msg);
    },
  });
};

export const useDeactivateUser = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Usuario desactivado.');
    },
    onError: (error: unknown) => {
      const msg = getApiErrorMessage(error, 'Error al desactivar usuario');
      toast.error(msg);
    },
  });
};

export const useResetUserPassword = () => {
  return useMutation<{ message: string; new_password: string }, Error, { id: number; new_password?: string }>({
    mutationFn: async ({ id, new_password }) => {
      const { data } = await api.put<{ message: string; new_password: string }>(
        `/users/${id}/reset-password`,
        new_password ? { new_password } : {}
      );
      return data;
    },
    onSuccess: ({ message }) => toast.success(message),
    onError: (error: unknown) => {
      const msg = getApiErrorMessage(error, 'Error al resetear contrasena');
      toast.error(msg);
    },
  });
};

