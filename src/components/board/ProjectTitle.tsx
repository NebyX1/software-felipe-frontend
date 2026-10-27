import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { useProjectById } from '../../api/hooks/useProjects';

interface ProjectTitleProps {
  projectId: number | string;
}

const ProjectTitle = ({ projectId }: ProjectTitleProps) => {
  const { data: project, isLoading } = useProjectById(projectId);

  if (isLoading) {
    return (
      <div style={{ height: '36px', width: '260px', borderRadius: '6px', background: 'var(--skeleton)', marginBottom: '24px', animation: 'pulse 2s infinite' }} />
    );
  }

  const accentColor = project?.unit_color || '#6366f1';

  return (
    <div style={{ marginBottom: '28px' }}>
      <Link
        to="/"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '12px', textDecoration: 'none', marginBottom: '12px', letterSpacing: '0.06em', transition: 'color 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-mid)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
      >
        <FiArrowLeft size={12} /> Proyectos
      </Link>
      {project?.unit_name && (
        <p style={{ color: accentColor, fontSize: '11px', letterSpacing: '0.22em', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>
          {project.unit_name}
        </p>
      )}
      <h1 style={{ color: 'var(--text)', fontSize: 'clamp(20px, 2.8vw, 28px)', fontWeight: 700, lineHeight: 1.25 }}>
        {project?.name || 'Proyecto'}
      </h1>
      <div style={{ height: '3px', width: '36px', borderRadius: '2px', background: `linear-gradient(90deg, ${accentColor}, transparent)`, marginTop: '10px' }} />
    </div>
  );
};

export default ProjectTitle;
