import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FiX, FiPlus } from 'react-icons/fi';
import { createTaskSchema, type CreateTaskSchema } from '../../schemas';
import { useCreateTask } from '../../api/hooks/useTasks';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  defaultStatus?: string;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  background: 'var(--muted-bg)',
  border: '1px solid var(--border-bright)',
  borderRadius: '8px',
  color: 'var(--text)',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 500,
  color: 'var(--text-muted)',
  marginBottom: '5px',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
};

const CreateTaskModal = ({ isOpen, onClose, projectId, defaultStatus = 'todo' }: CreateTaskModalProps) => {
  const createTask = useCreateTask();

  const { register, handleSubmit, formState: { errors }, reset, setFocus } = useForm<CreateTaskSchema>({
    resolver: zodResolver(createTaskSchema) as never,
    defaultValues: { status: defaultStatus as CreateTaskSchema['status'], priority: 'medium' },
  });

  useEffect(() => {
    if (isOpen) {
      reset({ status: defaultStatus as CreateTaskSchema['status'], priority: 'medium' });
      setTimeout(() => setFocus('title'), 50);
    }
  }, [isOpen, defaultStatus, reset, setFocus]);

  if (!isOpen) return null;

  const onSubmit = (data: CreateTaskSchema) => {
    createTask.mutate(
      { ...data, project_id: projectId },
      { onSuccess: () => { reset(); onClose(); } }
    );
  };

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border-bright)', borderRadius: '14px', width: '100%', maxWidth: '480px', boxShadow: 'var(--dropdown-shadow)', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiPlus size={16} color="#818cf8" />
            <h2 style={{ color: 'var(--text)', fontSize: '15px', fontWeight: 600, margin: 0 }}>Nueva tarea</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
            <FiX size={17} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Title */}
          <div>
            <label style={labelStyle}>Título *</label>
            <input {...register('title')} style={inputStyle} placeholder="Descripción breve de la tarea..." />
            {errors.title && <span style={{ color: '#ef4444', fontSize: '11px', marginTop: '3px', display: 'block' }}>{errors.title.message}</span>}
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Descripción</label>
            <textarea {...register('description')} rows={3} style={{ ...inputStyle, resize: 'vertical', minHeight: '72px' }} placeholder="Detalles adicionales..." />
          </div>

          {/* Responsible */}
          <div>
            <label style={labelStyle}>Responsable</label>
            <input {...register('responsible')} style={inputStyle} placeholder="Nombre del responsable..." />
          </div>

          {/* Due date + Priority row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Fecha de vencimiento</label>
              <input type="date" {...register('due_date')} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Prioridad</label>
              <select {...register('priority')} style={{ ...inputStyle, appearance: 'none' }}>
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label style={labelStyle}>Estado inicial</label>
            <select {...register('status')} style={{ ...inputStyle, appearance: 'none' }}>
              <option value="todo">Por hacer</option>
              <option value="in_progress">En progreso</option>
              <option value="review">En revisión</option>
              <option value="done">Terminado</option>
            </select>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px' }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 18px', background: 'var(--muted-bg)', border: '1px solid var(--border-bright)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createTask.isPending}
              style={{ padding: '9px 18px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: createTask.isPending ? 'not-allowed' : 'pointer', opacity: createTask.isPending ? 0.7 : 1 }}
            >
              {createTask.isPending ? 'Creando...' : 'Crear tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default CreateTaskModal;
