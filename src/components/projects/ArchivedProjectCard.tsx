import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCalendar, FiArrowRight, FiTrash2, FiArchive } from 'react-icons/fi';
import type { Project } from '../../types';
import DeleteProjectModal from './DeleteProjectModal';
import useAuth from '../../store/useAuth';

const fmtDate = (d: string) => {
  try {
    return new Intl.DateTimeFormat('es-ES', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(d));
  } catch {
    return '—';
  }
};

interface ArchivedProjectCardProps {
  project: Project;
}

const ArchivedProjectCard = ({ project }: ArchivedProjectCardProps) => {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const user = useAuth((s) => s.user);
  const canDelete = user?.role === 'admin' || user?.role === 'super_admin';
  const accentColor = project.unit_color || '#6366f1';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, boxShadow: '0 16px 48px rgba(0,0,0,0.35)' }}
      transition={{ duration: 0.25 }}
      style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', opacity: 0.9 }}
    >
      <div style={{ height: '3px', background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />

      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <span style={{ backgroundColor: `${accentColor}22`, color: accentColor, fontSize: '10px', letterSpacing: '0.1em', padding: '3px 10px', borderRadius: '99px', fontWeight: 600, textTransform: 'uppercase' }}>
            {project.unit_name || 'Sin unidad'}
          </span>
          <span style={{ backgroundColor: 'var(--muted-bg)', color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '0.1em', padding: '3px 10px', borderRadius: '99px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FiArchive size={10} /> Archivado
          </span>
        </div>

        <h3 style={{ color: 'var(--text)', fontSize: '16px', fontWeight: 600, lineHeight: 1.35, marginBottom: '8px' }}>
          {project.name}
        </h3>

        {project.description && (
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.55, marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {project.description}
          </p>
        )}

        <div style={{ borderTop: '1px solid var(--divider)', paddingTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FiCalendar size={12} color="var(--text-muted)" />
          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{fmtDate(project.created_at)}</span>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--divider)', display: 'flex' }}>
        <Link
          to={`/archivedboard/${project.id}`}
          style={{ color: '#818cf8', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '11px', fontSize: '11px', letterSpacing: '0.08em', textDecoration: 'none', transition: 'background 0.15s', textTransform: 'uppercase' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--muted-bg-hover)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <FiArrowRight size={14} /> Ver tablero
        </Link>
        {canDelete && (
          <>
            <div style={{ width: '1px', backgroundColor: 'var(--divider)' }} />
            <button
              onClick={() => setIsDeleteOpen(true)}
              style={{ color: '#ef4444', flex: 0.5, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '11px', fontSize: '11px', letterSpacing: '0.08em', transition: 'background 0.15s', textTransform: 'uppercase' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <FiTrash2 size={14} />
            </button>
          </>
        )}
      </div>

      <DeleteProjectModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} project={project} />
    </motion.div>
  );
};

export default ArchivedProjectCard;

