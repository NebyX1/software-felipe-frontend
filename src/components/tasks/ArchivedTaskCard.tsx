import { useState } from 'react';
import { FiCalendar, FiUser, FiEye } from 'react-icons/fi';
import type { Task } from '../../types';
import { PRIORITY_COLORS, PRIORITY_LABELS, STATUS_LABELS } from '../../types';
import TaskDetailModal from './TaskDetailModal';

const fmtDate = (d: string) =>
  new Intl.DateTimeFormat('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(d));

interface ArchivedTaskCardProps {
  task: Task;
}

const ArchivedTaskCard = ({ task }: ArchivedTaskCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const priorityColor = PRIORITY_COLORS[task.priority] || '#94a3b8';
  const priorityLabel = PRIORITY_LABELS[task.priority];
  const statusLabel = STATUS_LABELS[task.status];

  return (
    <>
      <div
        style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Badges */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <span style={{ backgroundColor: `${priorityColor}20`, color: priorityColor, fontSize: '10px', fontWeight: 600, padding: '2px 10px', borderRadius: '99px', border: `1px solid ${priorityColor}30`, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {priorityLabel}
          </span>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', padding: '2px 8px', background: 'var(--muted-bg)', borderRadius: '99px' }}>
            {statusLabel}
          </span>
        </div>

        {/* Title */}
        <h3 style={{ color: 'var(--text)', fontSize: '14px', fontWeight: 500, lineHeight: 1.4 }}>{task.title}</h3>

        {/* Meta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {task.responsible && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiUser size={10} color="#6366f1" />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{task.responsible}</span>
            </div>
          )}
          {task.due_date && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiCalendar size={10} color="#475569" />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{fmtDate(task.due_date)}</span>
            </div>
          )}
        </div>

        {/* View details */}
        <button
          onClick={() => setIsModalOpen(true)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.2)', borderRadius: '7px', color: '#818cf8', fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(129,140,248,0.14)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(129,140,248,0.08)'; }}
        >
          <FiEye size={13} /> Ver detalles
        </button>
      </div>

      <TaskDetailModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} task={task} />
    </>
  );
};

export default ArchivedTaskCard;

