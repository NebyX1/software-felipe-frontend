import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiArchive } from 'react-icons/fi';
import { useProjects } from '../api/hooks/useProjects';
import ArchivedProjectCard from '../components/projects/ArchivedProjectCard';

const ArchivedProjects = () => {
  const { data: projects = [], isLoading, isError } = useProjects(true);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: 'var(--muted-bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FiArchive size={16} color="var(--text-muted)" />
        </div>
        <div>
          <h1 style={{ color: 'var(--text)', fontSize: '24px', fontWeight: 700, margin: 0 }}>Proyectos archivados</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '3px' }}>
            {projects.length} proyecto{projects.length !== 1 ? 's' : ''} en archivo
          </p>
        </div>
      </div>

      {isLoading && <LoadingGrid />}
      {isError && <div style={{ textAlign: 'center', padding: '48px', color: '#ef4444' }}>Error al cargar proyectos archivados.</div>}

      {!isLoading && !isError && projects.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '40px', marginBottom: '14px' }}>🗃️</div>
          <p style={{ color: 'var(--text-muted)' }}>No hay proyectos archivados.</p>
        </div>
      )}

      {!isLoading && !isError && projects.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {projects.map((project, i) => (
            <motion.div key={project.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <ArchivedProjectCard project={project} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

const LoadingGrid = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} style={{ height: '200px', background: 'var(--skeleton)', borderRadius: '12px' }} />
    ))}
  </div>
);

export default ArchivedProjects;

