import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import api from '../axios';
import type { Unit } from '../../types';
import type { CreateUnitSchema } from '../../schemas';

const QUERY_KEY = 'units';

export const useUnits = () => {
  return useQuery<Unit[]>({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const { data } = await api.get<{ units: Unit[] }>('/units');
      return data.units;
    },
  });
};

export const useCreateUnit = () => {
  const qc = useQueryClient();
  return useMutation<Unit, Error, CreateUnitSchema>({
    mutationFn: async (payload) => {
      const { data } = await api.post<{ unit: Unit }>('/units', payload);
      return data.unit;
    },
    onSuccess: (unit) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success(`Unidad "${unit.name}" creada.`);
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data: { error?: string } } }).response?.data.error ||
        'Error al crear unidad';
      toast.error(msg);
    },
  });
};

export const useUpdateUnit = () => {
  const qc = useQueryClient();
  return useMutation<Unit, Error, { id: number; data: Partial<CreateUnitSchema> }>({
    mutationFn: async ({ id, data: payload }) => {
      const { data } = await api.put<{ unit: Unit }>(`/units/${id}`, payload);
      return data.unit;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Unidad actualizada.');
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data: { error?: string } } }).response?.data.error ||
        'Error al actualizar unidad';
      toast.error(msg);
    },
  });
};

export const useDeleteUnit = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await api.delete(`/units/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Unidad eliminada.');
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data: { error?: string } } }).response?.data.error ||
        'Error al eliminar unidad';
      toast.error(msg);
    },
  });
};


