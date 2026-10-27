import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import api from '../axios';
import useAuth from '../../store/useAuth';
import type { User } from '../../types';
import type { LoginSchema } from '../../schemas';

interface LoginStep1Response {
  requires_2fa: boolean;
  pending_token: string;
}

interface LoginStep2Response {
  access_token: string;
  user: User;
}

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

export const useLoginStep1 = () => {
  return useMutation<LoginStep1Response, Error, LoginSchema>({
    mutationFn: async (credentials) => {
      const { data } = await api.post<LoginStep1Response>('/auth/login', credentials);
      return data;
    },
    onError: (error: unknown) => {
      const msg = getApiErrorMessage(error, 'Error al iniciar sesion');
      toast.error(msg);
    },
  });
};

export const useLoginStep2 = () => {
  const login = useAuth((s) => s.login);

  return useMutation<LoginStep2Response, Error, { pending_token: string; code: string }>({
    mutationFn: async ({ pending_token, code }) => {
      const { data } = await api.post<LoginStep2Response>(
        '/auth/verify-2fa',
        { code },
        { headers: { Authorization: `Bearer ${pending_token}` } }
      );
      return data;
    },
    onSuccess: ({ access_token, user }) => {
      login(access_token, user);
      toast.success(`Bienvenido/a, ${user.name}!`);
    },
    onError: (error: unknown) => {
      const msg = getApiErrorMessage(error, 'Codigo invalido');
      toast.error(msg);
    },
  });
};

export const useChangePassword = () => {
  return useMutation<{ message: string }, Error, { current_password: string; new_password: string }>({
    mutationFn: async (payload) => {
      const { data } = await api.put<{ message: string }>('/auth/change-password', payload);
      return data;
    },
    onSuccess: ({ message }) => toast.success(message),
    onError: (error: unknown) => {
      const msg = getApiErrorMessage(error, 'Error al cambiar contrasena');
      toast.error(msg);
    },
  });
};


