import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCalendar, FiArrowRight, FiArchive, FiBarChart2, FiActivity, FiTrash2 } from 'react-icons/fi';
import type { Project } from '../../types';
import ArchiveProjectModal from './ArchiveProjectModal';
import DeleteProjectModal from './DeleteProjectModal';
import useAuth from '../../store/useAuth';

const fmtDate = (d: string) => {
  try {
    return new Intl.DateTimeFormat('es-ES', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(d));
  } catch {
    return '—';
  }
};

interface ProjectCardProps {
  project: Project;
}

const ProjectCard = ({ project }: ProjectCardProps) => {
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const user = useAuth((s) => s.user);
  const canDelete = user?.role === 'admin' || user?.role === 'super_admin';

  const accentColor = project.unit_color || '#6366f1';

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{
      background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Accent stripe */}
      <div style={{ height: '3px', background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />

      <div style={{ padding: '20px 20px 16px', flex: 1 }}>
        {/* Unit badge */}
        <span style={{
          display: 'inline-block',
          backgroundColor: `${accentColor}18`,
          color: accentColor,
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.1em',
          padding: '3px 10px',
          borderRadius: '99px',
          border: `1px solid ${accentColor}30`,
          marginBottom: '14px',
          textTransform: 'uppercase',
        }}>
          {project.unit_name || 'Sin unidad'}
        </span>

        {/* Project name */}
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, marginBottom: '8px' }}>
          {project.name}
        </h3>

        {/* Description */}
        {project.description && (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {project.description}
          </p>
        )}

        {/* Footer info */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiCalendar size={12} color="#f59e0b" />
            <span style={{ fontSize: '11px', color: 'var(--text-mid)' }}>{fmtDate(project.created_at)}</span>
          </div>
          {project.task_count !== undefined && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{project.task_count} tareas</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ borderTop: '1px solid var(--divider)', display: 'flex' }}>
        {([
          { to: `/board/${project.id}`, Icon: FiArrowRight, title: 'Tablero', color: accentColor },
          { to: `/kpis/${project.id}`, Icon: FiBarChart2, title: 'KPIs', color: '#818cf8' },
          { to: `/gantt/${project.id}`, Icon: FiActivity, title: 'Gantt', color: '#38bdf8' },
        ] as const).map(({ to, Icon, title, color }, i) => (
          <span key={to}>
            {i > 0 && <div style={{ width: '1px', backgroundColor: 'var(--divider)' }} />}
            <Link
              to={to}
              title={title}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', color, transition: 'background 0.15s', textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--muted-bg-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Icon size={15} />
            </Link>
          </span>
        ))}
        <div style={{ width: '1px', backgroundColor: 'var(--divider)' }} />
        <button
          onClick={() => setIsArchiveOpen(true)}
          title="Archivar"
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', transition: 'background 0.15s, color 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(245,158,11,0.08)'; e.currentTarget.style.color = '#f59e0b'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <FiArchive size={14} />
        </button>
        {canDelete && (
          <>
            <div style={{ width: '1px', backgroundColor: 'var(--divider)' }} />
            <button
              onClick={() => setIsDeleteOpen(true)}
              title="Eliminar"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', transition: 'background 0.15s, color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#ef4444'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <FiTrash2 size={14} />
            </button>
          </>
        )}
      </div>

      <ArchiveProjectModal isOpen={isArchiveOpen} onClose={() => setIsArchiveOpen(false)} project={project} />
      <DeleteProjectModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} project={project} />
    </motion.div>
  );
};

export default ProjectCard;

