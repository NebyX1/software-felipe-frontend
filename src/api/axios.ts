import axios from 'axios';
import useAuth from '../store/useAuth';
import { toast } from 'react-hot-toast';

import { apiBaseUrl } from './baseUrl';

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuth.getState().token;
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const { token, logout } = useAuth.getState();

    if (status === 401 && token) {
      toast.error('Sesión expirada. Por favor, inicia sesión de nuevo.');
      logout();
    }
    return Promise.reject(error);
  }
);

export default api;
