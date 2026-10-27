import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPlus, FiArchive } from 'react-icons/fi';
import { useProjects } from '../api/hooks/useProjects';
import useAuth from '../store/useAuth';
import ProjectCard from '../components/projects/ProjectCard';
import CreateProjectModal from '../components/projects/CreateProjectModal';

const Home = () => {
  const [showCreate, setShowCreate] = useState(false);
  const user = useAuth((s) => s.user);
  const { data: projects = [], isLoading, isError } = useProjects(false);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ color: 'var(--text)', fontSize: '26px', fontWeight: 700, margin: 0 }}>
            Proyectos activos
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            {user?.unit_name ? `Unidad: ${user.unit_name}` : 'Vista de administrador — todas las unidades'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/archived" style={secondaryBtnStyle}>
            <FiArchive size={14} />
            Archivados
          </Link>
          <button onClick={() => setShowCreate(true)} style={primaryBtnStyle}>
            <FiPlus size={14} />
            Nuevo proyecto
          </button>
        </div>
      </div>

      {/* States */}
      {isLoading && <LoadingGrid />}
      {isError && <ErrorMessage />}

      {!isLoading && !isError && projects.length === 0 && (
        <EmptyState onCreate={() => setShowCreate(true)} />
      )}

      {/* Grid */}
      {!isLoading && !isError && projects.length > 0 && (
        <div style={gridStyle}>
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </div>
      )}

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} />}
    </div>
  );
};

export default Home;

// ?"——? Sub-components ?"——————————————————————————————————————————————————————————?

const LoadingGrid = () => (
  <div style={gridStyle}>
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} style={skeletonCard} />
    ))}
  </div>
);

const ErrorMessage = () => (
  <div style={{ textAlign: 'center', padding: '64px', color: '#ef4444' }}>
    <p>Error al cargar proyectos. Verifica tu conexión.</p>
  </div>
);

const EmptyState = ({ onCreate }: { onCreate: () => void }) => (
  <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--text-muted)' }}>
    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
    <h3 style={{ color: 'var(--text-mid)', fontWeight: 600 }}>No hay proyectos aún</h3>
    <p style={{ fontSize: '14px', marginBottom: '24px' }}>
      Crea el primer proyecto para comenzar a gestionar tareas.
    </p>
    <button onClick={onCreate} style={primaryBtnStyle}>
      <FiPlus size={14} />
      Crear primer proyecto
    </button>
  </div>
);

// ?"——? Styles ?"——————————————————————————————————————————————————————————————————?

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: '20px',
};

const primaryBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  padding: '10px 18px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  textDecoration: 'none',
};

const secondaryBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  background: 'var(--cancel-btn-bg)',
  color: 'var(--text-mid)',
  border: '1px solid var(--cancel-btn-border)',
  borderRadius: '8px',
  padding: '10px 18px',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
  textDecoration: 'none',
};

const skeletonCard: React.CSSProperties = {
  height: '180px',
  background: 'var(--skeleton)',
  borderRadius: '12px',
  animation: 'pulse 2s infinite',
};

