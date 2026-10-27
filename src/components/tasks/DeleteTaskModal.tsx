import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import { useDeleteTask } from '../../api/hooks/useTasks';

interface DeleteTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: number;
  projectId: number;
}

const DeleteTaskModal = ({ isOpen, onClose, taskId, projectId }: DeleteTaskModalProps) => {
  const [confirmed, setConfirmed] = useState(false);
  const deleteTask = useDeleteTask();

  useEffect(() => {
    setConfirmed(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDelete = () => {
    deleteTask.mutate({ taskId, projectId }, { onSuccess: onClose });
  };

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: 'var(--surface)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '14px', width: '100%', maxWidth: '400px', padding: '24px', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FiAlertTriangle size={16} color="#ef4444" />
          </div>
          <h2 style={{ color: 'var(--text)', fontSize: '15px', fontWeight: 600, margin: 0 }}>Eliminar tarea</h2>
        </div>

        <p style={{ color: 'var(--text-mid)', fontSize: '13px', lineHeight: 1.6, marginBottom: '18px' }}>
          Esta acción es <strong style={{ color: '#ef4444' }}>permanente</strong>. La tarea no podrá recuperarse.
        </p>

        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '20px' }}>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            style={{ width: '15px', height: '15px', accentColor: '#ef4444', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '13px', color: 'var(--text-mid)' }}>Confirmo que deseo eliminar esta tarea</span>
        </label>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', background: 'var(--cancel-btn-bg)', border: '1px solid var(--cancel-btn-border)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer' }}>
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={!confirmed || deleteTask.isPending}
            style={{ padding: '9px 18px', background: confirmed ? '#ef4444' : 'rgba(239,68,68,0.18)', border: 'none', borderRadius: '8px', color: confirmed ? '#fff' : 'var(--text-muted)', fontSize: '13px', fontWeight: 600, cursor: confirmed ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
          >
            <FiTrash2 size={12} />
            {deleteTask.isPending ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DeleteTaskModal;

