import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiArchive, FiPlus, FiHardDrive } from 'react-icons/fi';
import { useProjects } from '../api/hooks/useProjects';
import { useUnits } from '../api/hooks/useUnits';
import useAuth from '../store/useAuth';
import ProjectCard from '../components/projects/ProjectCard';
import CreateProjectModal from '../components/projects/CreateProjectModal';

const AreaProjects = () => {
  const user = useAuth((s) => s.user);
  const { unitId } = useParams<{ unitId?: string }>();
  const [showCreate, setShowCreate] = useState(false);

  const isAdminView = user?.role === 'admin' || user?.role === 'super_admin';

  const selectedUnitId = useMemo(() => {
    if (isAdminView) {
      return unitId ? Number(unitId) : undefined;
    }
    return user?.unit_id ?? undefined;
  }, [isAdminView, unitId, user?.unit_id]);

  const { data: units = [] } = useUnits();
  const { data: projects = [], isLoading, isError } = useProjects(false, selectedUnitId);

  const selectedUnit = units.find((u) => u.id === selectedUnitId);

  if (!selectedUnitId) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ color: 'var(--text)' }}>No hay un área seleccionada</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Tu usuario no tiene área asignada o falta seleccionar un área.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '26px', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ color: 'var(--text)', fontSize: '26px', margin: 0 }}>
            {selectedUnit?.emoji || user?.unit_emoji || '🏛️'} {selectedUnit?.name || user?.unit_name || 'Mi área'}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '14px' }}>
            Gestión de proyectos del área.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to={isAdminView ? `/admin/areas/${selectedUnitId}/works` : '/works'} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', color: 'var(--text-mid)', textDecoration: 'none', background: 'var(--surface)' }}>
            <FiHardDrive size={14} />
            Obras
          </Link>
          <Link to="/archived" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', color: 'var(--text-mid)', textDecoration: 'none', background: 'var(--surface)' }}>
            <FiArchive size={14} />
            Archivados
          </Link>
          <button onClick={() => setShowCreate(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: 'none', borderRadius: '8px', padding: '10px 16px', cursor: 'pointer', color: '#fff', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', fontWeight: 600 }}>
            <FiPlus size={14} />
            Nuevo proyecto
          </button>
        </div>
      </div>

      {isLoading && <div style={{ color: 'var(--text-muted)' }}>Cargando proyectos...</div>}
      {isError && <div style={{ color: '#ef4444' }}>Error al cargar proyectos.</div>}

      {!isLoading && !isError && projects.length === 0 && (
        <div style={{ padding: '48px 20px', border: '1px dashed var(--border)', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No hay proyectos en esta área todavía.
        </div>
      )}

      {!isLoading && !isError && projects.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} />}
    </div>
  );
};

export default AreaProjects;
