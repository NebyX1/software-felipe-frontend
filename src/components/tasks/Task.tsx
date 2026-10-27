import { FiCalendar, FiUser, FiAlertCircle } from 'react-icons/fi';
import type { Task as TaskType } from '../../types';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '../../types';

const fmtDate = (d: string) => {
  try {
    return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' }).format(new Date(d));
  } catch {
    return '—';
  }
};

interface TaskProps {
  task: TaskType;
  onClick?: () => void;
}

const Task = ({ task, onClick }: TaskProps) => {
  const priorityColor = PRIORITY_COLORS[task.priority] || '#64748b';
  const priorityLabel = PRIORITY_LABELS[task.priority] || task.priority;
  const overdue = !!task.due_date && new Date(task.due_date) < new Date();

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '14px',
        transition: 'border-color 0.15s, transform 0.15s, box-shadow 0.15s',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--border-bright)';
        if (onClick) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
      }}
    >
      {/* Priority + overdue */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
        <span style={{
          backgroundColor: `${priorityColor}20`,
          color: priorityColor,
          fontSize: '9px',
          fontWeight: 700,
          letterSpacing: '0.12em',
          padding: '2px 8px',
          borderRadius: '99px',
          border: `1px solid ${priorityColor}30`,
          textTransform: 'uppercase',
        }}>
          {priorityLabel}
        </span>
        {overdue && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#ef4444', fontSize: '9px', fontWeight: 600 }}>
            <FiAlertCircle size={9} /> Vencida
          </span>
        )}
      </div>

      {/* Title */}
      <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', lineHeight: 1.5, marginBottom: '12px' }}>
        {task.title}
      </p>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {task.responsible && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiUser size={10} color="#6366f1" />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{task.responsible}</span>
          </div>
        )}
        {task.due_date && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FiCalendar size={9} color={overdue ? '#ef4444' : 'var(--text-mid)'} />
            <span style={{ fontSize: '10px', color: overdue ? '#ef4444' : 'var(--text-mid)' }}>
              {fmtDate(task.due_date)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Task;
