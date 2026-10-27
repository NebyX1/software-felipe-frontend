import { Link } from 'react-router-dom';
import { FiArrowRight, FiSettings, FiHardDrive } from 'react-icons/fi';
import { useUnits } from '../api/hooks/useUnits';

const AdminAreas = () => {
  const { data: units = [], isLoading, isError } = useUnits();

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ color: 'var(--text)', fontSize: '26px', margin: 0 }}>Dashboard de áreas</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '14px' }}>
            Selecciona un área para ver y gestionar sus proyectos.
          </p>
        </div>
        <Link to="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border)', textDecoration: 'none', color: 'var(--text-mid)', background: 'var(--surface)' }}>
          <FiSettings size={14} />
          Configuración
        </Link>
      </div>

      {isLoading && <div style={{ color: 'var(--text-muted)' }}>Cargando áreas...</div>}
      {isError && <div style={{ color: '#ef4444' }}>Error al cargar áreas.</div>}

      {!isLoading && !isError && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {units.map((unit) => (
            <Link
              key={unit.id}
              to={`/admin/areas/${unit.id}`}
              style={{
                textDecoration: 'none',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '18px',
                color: 'var(--text)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `${unit.color}22`, border: `1px solid ${unit.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                    {unit.emoji || '🏛️'}
                  </div>
                  <div style={{ fontWeight: 600 }}>{unit.name}</div>
                </div>
                <FiArrowRight size={16} color="var(--text-muted)" />
              </div>
              {unit.description && (
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.45 }}>
                  {unit.description}
                </p>
              )}
              <div style={{ marginTop: 'auto', color: 'var(--text-muted)', fontSize: '12px' }}>
                {unit.project_count} proyectos · {unit.user_count} usuarios
              </div>
              <div style={{ marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-mid)' }}>
                <FiHardDrive size={12} /> Tablero de obras disponible
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminAreas;
