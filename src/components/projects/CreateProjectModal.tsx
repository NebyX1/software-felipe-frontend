import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FiX, FiFolder } from 'react-icons/fi';
import { createProjectSchema, type CreateProjectSchema } from '../../schemas';
import { useCreateProject } from '../../api/hooks/useProjects';
import { useUnits } from '../../api/hooks/useUnits';
import useAuth from '../../store/useAuth';

interface CreateProjectModalProps {
  onClose: () => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
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
  fontSize: '12px',
  fontWeight: 500,
  color: 'var(--text-muted)',
  marginBottom: '6px',
  letterSpacing: '0.05em',
};

const CreateProjectModal = ({ onClose }: CreateProjectModalProps) => {
  const user = useAuth((s) => s.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const { data: units = [] } = useUnits();
  const createProject = useCreateProject();

  const { register, handleSubmit, formState: { errors }, setFocus } = useForm<CreateProjectSchema>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { status: 'todo', priority: 'medium' } as Partial<CreateProjectSchema>,
  });

  useEffect(() => {
    setFocus('name');
  }, [setFocus]);

  const onSubmit = (data: CreateProjectSchema) => {
    const payload = isAdmin ? data : { ...data, unit_id: user?.unit_id ?? undefined };
    createProject.mutate(payload, { onSuccess: onClose });
  };

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', width: '100%', maxWidth: '480px', boxShadow: 'var(--dropdown-shadow)' }}>
        {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiFolder size={15} color="#818cf8" />
            </div>
            <h2 style={{ color: 'var(--text)', fontSize: '16px', fontWeight: 600, margin: 0 }}>Nuevo proyecto</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
            <FiX size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Name */}
          <div>
            <label style={labelStyle}>Nombre del proyecto *</label>
            <input {...register('name')} style={inputStyle} placeholder="Ej: Plan de pavimentación 2025" />
            {errors.name && <span style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.name.message}</span>}
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Descripción</label>
            <textarea
              {...register('description')}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
              placeholder="Descripción opcional del proyecto..."
            />
            {errors.description && <span style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.description.message}</span>}
          </div>

          {/* Unit (admin only) */}
          {isAdmin && (
            <div>
              <label style={labelStyle}>Unidad / área *</label>
              <select
                {...register('unit_id', { valueAsNumber: true })}
                style={{ ...inputStyle, appearance: 'none' }}
              >
                <option value="">Seleccionar unidad...</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
              {errors.unit_id && <span style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.unit_id.message}</span>}
            </div>
          )}

          {!isAdmin && user?.unit_name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: 'rgba(99,102,241,0.08)', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)' }}>
              <span style={{ fontSize: '12px', color: '#818cf8' }}>Unidad:</span>
              <span style={{ fontSize: '13px', color: 'var(--text)' }}>{user.unit_name}</span>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', background: 'var(--cancel-btn-bg)', border: '1px solid var(--cancel-btn-border)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createProject.isPending}
              style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: createProject.isPending ? 'not-allowed' : 'pointer', opacity: createProject.isPending ? 0.7 : 1 }}
            >
              {createProject.isPending ? 'Creando...' : 'Crear proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default CreateProjectModal;

