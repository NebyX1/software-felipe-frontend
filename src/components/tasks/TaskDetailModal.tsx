import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';
import type { Task } from '../../types';
import { PRIORITY_LABELS, STATUS_LABELS } from '../../types';

const fmtDate = (d: string) => {
  try {
    return new Intl.DateTimeFormat('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(d));
  } catch {
    return 'Fecha inválida';
  }
};

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
}

const fieldStyle: React.CSSProperties = {
  padding: '10px 12px',
  background: 'var(--muted-bg)',
  borderRadius: '8px',
  color: 'var(--text)',
  fontSize: '13px',
  minHeight: '38px',
  border: '1px solid var(--border)',
};

const TaskDetailModal = ({ isOpen, onClose, task }: TaskDetailModalProps) => {
  if (!isOpen) return null;

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', width: '100%', maxWidth: '480px', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--surface)' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '15px', fontWeight: 600, margin: 0 }}>Detalles de la tarea</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 10px', borderRadius: '99px', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>Archivada</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
              <FiX size={17} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Field label="Título"><div style={fieldStyle}>{task.title}</div></Field>
          <Field label="Descripción">
            <div style={{ ...fieldStyle, whiteSpace: 'pre-wrap', minHeight: '80px' }}>{task.description || '—'}</div>
          </Field>
          <Field label="Responsable"><div style={fieldStyle}>{task.responsible || '—'}</div></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="Fecha de vencimiento"><div style={fieldStyle}>{task.due_date ? fmtDate(task.due_date) : '—'}</div></Field>
            <Field label="Creada"><div style={fieldStyle}>{fmtDate(task.created_at)}</div></Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="Prioridad"><div style={fieldStyle}>{PRIORITY_LABELS[task.priority]}</div></Field>
            <Field label="Estado"><div style={fieldStyle}>{STATUS_LABELS[task.status]}</div></Field>
          </div>
        </div>

        <div style={{ padding: '16px 22px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 20px', background: 'var(--cancel-btn-bg)', border: '1px solid var(--cancel-btn-border)', borderRadius: '8px', color: 'var(--text-mid)', fontSize: '13px', cursor: 'pointer' }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
    {children}
  </div>
);

export default TaskDetailModal;

