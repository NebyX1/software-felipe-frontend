import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import type { Project } from '../../types';
import { useDeleteProject } from '../../api/hooks/useProjects';

interface DeleteProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

const DeleteProjectModal = ({ isOpen, onClose, project }: DeleteProjectModalProps) => {
  const [confirmed, setConfirmed] = useState(false);
  const deleteProject = useDeleteProject();

  useEffect(() => {
    setConfirmed(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDelete = () => {
    deleteProject.mutate(project.id, { onSuccess: onClose });
  };

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: 'var(--surface)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '14px', width: '100%', maxWidth: '440px', padding: '28px', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FiAlertTriangle size={18} color="#ef4444" />
          </div>
          <div>
            <h2 style={{ color: 'var(--text)', fontSize: '16px', fontWeight: 600, margin: 0 }}>Eliminar proyecto</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>{project.name}</p>
          </div>
        </div>

        <p style={{ color: 'var(--text-mid)', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>
          Esta acción es <strong style={{ color: '#ef4444' }}>permanente e irreversible</strong>. Se eliminarán el proyecto y todas sus tareas asociadas.
        </p>

        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '24px' }}>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: '#ef4444', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '13px', color: 'var(--text-mid)' }}>Confirmo que deseo eliminar este proyecto permanentemente</span>
        </label>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', background: 'var(--cancel-btn-bg)', border: '1px solid var(--cancel-btn-border)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer' }}>
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={!confirmed || deleteProject.isPending}
            style={{ padding: '10px 20px', background: confirmed ? '#ef4444' : 'rgba(239,68,68,0.18)', border: 'none', borderRadius: '8px', color: confirmed ? '#fff' : 'var(--text-muted)', fontSize: '13px', fontWeight: 600, cursor: confirmed ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
          >
            <FiTrash2 size={13} />
            {deleteProject.isPending ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DeleteProjectModal;

