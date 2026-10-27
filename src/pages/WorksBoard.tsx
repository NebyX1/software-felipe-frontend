import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  FiArrowRight,
  FiBarChart2,
  FiEdit2,
  FiPlus,
  FiTrash2,
} from 'react-icons/fi';
import { useUnits } from '../api/hooks/useUnits';
import {
  useCreateWork,
  useDeleteWork,
  useUpdateWork,
  useWorks,
} from '../api/hooks/useWorks';
import useAuth from '../store/useAuth';
import type {
  CreateWorkInput,
  Work,
  WorkStatus,
} from '../types';

type WorkCurrency = 'UYU' | 'USD' | 'EUR';

const STATUS_LABELS: Record<WorkStatus, string> = {
  planning: 'Planificacion',
  in_progress: 'En ejecucion',
  paused: 'Pausada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

const STATUS_COLORS: Record<WorkStatus, string> = {
  planning: '#3b82f6',
  in_progress: '#22c55e',
  paused: '#f59e0b',
  completed: '#10b981',
  cancelled: '#ef4444',
};

const CURRENCY_OPTIONS: WorkCurrency[] = ['UYU', 'USD', 'EUR'];

const digitsOnly = (value: string) => value.replace(/\D/g, '');

const formatThousandsWithDot = (value: string) => {
  const digits = digitsOnly(value);
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const parseBudgetNumber = (formatted: string) => {
  const raw = digitsOnly(formatted);
  return raw ? Number(raw) : undefined;
};

export default function WorksBoard() {
  const user = useAuth((s) => s.user);
  const { unitId } = useParams<{ unitId?: string }>();
  const isAdminView = user?.role === 'admin' || user?.role === 'super_admin';

  const selectedUnitId = useMemo(() => {
    if (isAdminView) {
      return unitId ? Number(unitId) : undefined;
    }
    return user?.unit_id ?? undefined;
  }, [isAdminView, unitId, user?.unit_id]);

  const { data: units = [] } = useUnits();
  const unit = units.find((u) => u.id === selectedUnitId);

  const { data: works = [], isLoading, isError } = useWorks(selectedUnitId);
  const createWork = useCreateWork();
  const updateWork = useUpdateWork();
  const deleteWork = useDeleteWork();

  const [showForm, setShowForm] = useState(false);
  const [editingWork, setEditingWork] = useState<Work | null>(null);
  const [budgetInput, setBudgetInput] = useState('');
  const [budgetCurrency, setBudgetCurrency] = useState<WorkCurrency>('UYU');
  const [formData, setFormData] = useState<CreateWorkInput>({
    title: '',
    description: '',
    location: '',
    status: 'planning',
    progress: 0,
  });

  if (!selectedUnitId) {
    return (
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '36px 24px' }}>
        <h1 style={{ color: 'var(--text)' }}>No hay area seleccionada</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Tu usuario no tiene un area activa para gestionar obras.
        </p>
      </div>
    );
  }

  const totals = {
    all: works.length,
    active: works.filter((w) => w.status === 'in_progress').length,
    planning: works.filter((w) => w.status === 'planning').length,
    completed: works.filter((w) => w.status === 'completed').length,
  };

  const openCreate = () => {
    setEditingWork(null);
    setFormData({
      title: '',
      description: '',
      location: '',
      status: 'planning',
      progress: 0,
      unit_id: selectedUnitId,
    });
    setBudgetInput('');
    setBudgetCurrency('UYU');
    setShowForm(true);
  };

  const openEdit = (work: Work) => {
    setEditingWork(work);
    setFormData({
      unit_id: selectedUnitId,
      title: work.title,
      description: work.description ?? '',
      location: work.location ?? '',
      status: work.status,
      progress: work.progress,
      start_date: work.start_date ?? '',
      end_date: work.end_date ?? '',
    });
    setBudgetInput(
      work.budget !== null && work.budget !== undefined
        ? formatThousandsWithDot(String(Math.trunc(work.budget)))
        : ''
    );
    setBudgetCurrency('UYU');
    setShowForm(true);
  };

  const submitWork = () => {
    const payload: CreateWorkInput = {
      ...formData,
      title: (formData.title || '').trim(),
      description: (formData.description || '').trim() || undefined,
      location: (formData.location || '').trim() || undefined,
      budget: parseBudgetNumber(budgetInput),
      unit_id: selectedUnitId,
    };

    if (!payload.title) {
      return;
    }

    if (editingWork) {
      updateWork.mutate({ id: editingWork.id, data: payload }, { onSuccess: () => setShowForm(false) });
      return;
    }

    createWork.mutate(payload, { onSuccess: () => setShowForm(false) });
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '30px 22px 40px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text)', fontSize: 'clamp(28px, 4vw, 38px)', lineHeight: 1.05 }}>
            {unit?.emoji || user?.unit_emoji || '🏗️'} Centro de Obras - {unit?.name || 'Area'}
          </h1>
          <p style={{ marginTop: '10px', color: 'var(--text-mid)', fontSize: '15px', maxWidth: 760 }}>
            Dashboard general de obras por area. Desde aqui gestionas cada obra y entras a su tablero Kanban de tareas tecnicas.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Link to={isAdminView ? `/admin/areas/${selectedUnitId}` : '/area'} style={ghostBtnStyle}>Volver a proyectos</Link>
          <button onClick={openCreate} style={primaryBtnStyle}>
            <FiPlus size={15} /> Nueva obra
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '18px' }}>
        <SummaryCard label='Obras totales' value={totals.all} color='#3b82f6' />
        <SummaryCard label='En ejecucion' value={totals.active} color='#22c55e' />
        <SummaryCard label='Planificacion' value={totals.planning} color='#f59e0b' />
        <SummaryCard label='Completadas' value={totals.completed} color='#10b981' />
      </div>

      {showForm && (
        <div style={formPanelStyle}>
          <h3 style={{ marginTop: 0, color: 'var(--text)' }}>
            {editingWork ? 'Editar obra' : 'Nueva obra'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
            <div>
              <label style={fieldLabelStyle}>Titulo de obra</label>
              <input value={formData.title ?? ''} onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))} placeholder='Titulo de obra' style={inputStyle} />
            </div>
            <div>
              <label style={fieldLabelStyle}>Ubicacion</label>
              <input value={formData.location ?? ''} onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))} placeholder='Ubicacion' style={inputStyle} />
            </div>
            <div>
              <label style={fieldLabelStyle}>Estado</label>
              <select value={formData.status ?? 'planning'} onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value as WorkStatus }))} style={inputStyle}>
                {Object.keys(STATUS_LABELS).map((status) => (
                  <option key={status} value={status}>{STATUS_LABELS[status as WorkStatus]}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={fieldLabelStyle}>Avance (%)</label>
              <input type='number' min={0} max={100} value={formData.progress ?? 0} onChange={(e) => setFormData((p) => ({ ...p, progress: Number(e.target.value) }))} placeholder='Avance %' style={inputStyle} />
            </div>
            <div>
              <label style={fieldLabelStyle}>Fecha de inicio</label>
              <input type='date' value={formData.start_date ?? ''} onChange={(e) => setFormData((p) => ({ ...p, start_date: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={fieldLabelStyle}>Fecha de fin</label>
              <input type='date' value={formData.end_date ?? ''} onChange={(e) => setFormData((p) => ({ ...p, end_date: e.target.value }))} style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) 110px', gap: '8px' }}>
              <div>
                <label style={fieldLabelStyle}>Presupuesto</label>
                <input
                  type='text'
                  inputMode='numeric'
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(formatThousandsWithDot(e.target.value))}
                  placeholder='Presupuesto'
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={fieldLabelStyle}>Moneda</label>
                <select
                  value={budgetCurrency}
                  onChange={(e) => setBudgetCurrency(e.target.value as WorkCurrency)}
                  style={inputStyle}
                  aria-label='Moneda de presupuesto'
                >
                  {CURRENCY_OPTIONS.map((currency) => (
                    <option key={currency} value={currency}>{currency}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div style={{ marginTop: '10px' }}>
            <label style={fieldLabelStyle}>Descripcion tecnica general</label>
            <textarea value={formData.description ?? ''} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} rows={3} placeholder='Descripcion tecnica general' style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button style={ghostBtnStyle} onClick={() => setShowForm(false)}>Cancelar</button>
            <button style={primaryBtnStyle} onClick={submitWork}>{editingWork ? 'Guardar cambios' : 'Crear obra'}</button>
          </div>
        </div>
      )}

      <div>
        {isLoading && <div style={{ color: 'var(--text-muted)' }}>Cargando obras...</div>}
        {isError && <div style={{ color: '#ef4444' }}>No se pudieron cargar las obras.</div>}

        {!isLoading && !isError && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
            {works.map((work) => {
                const boardPath = isAdminView
                  ? `/admin/areas/${selectedUnitId}/works/${work.id}/board`
                  : `/works/${work.id}/board`;
                const kpiPath = isAdminView
                  ? `/admin/areas/${selectedUnitId}/works/${work.id}/kpis`
                  : `/works/${work.id}/kpis`;

                return (
                  <article key={work.id} style={workCardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '10px' }}>
                      <div>
                        <h3 style={{ margin: 0, color: 'var(--text)', fontSize: '18px', lineHeight: 1.25 }}>{work.title}</h3>
                        <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '12px' }}>
                          {work.location || 'Sin ubicacion'}
                        </p>
                      </div>
                      <span style={{ fontSize: '11px', color: STATUS_COLORS[work.status], background: `${STATUS_COLORS[work.status]}18`, border: `1px solid ${STATUS_COLORS[work.status]}44`, borderRadius: '999px', padding: '3px 8px', height: 'fit-content' }}>
                        {STATUS_LABELS[work.status]}
                      </span>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ height: '8px', borderRadius: '999px', background: 'var(--muted-bg)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${work.progress}%`, background: 'linear-gradient(90deg, #22c55e, #16a34a)' }} />
                      </div>
                      <div style={{ marginTop: '7px', display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '12px' }}>
                        <span>{work.progress}% avance general</span>
                        <span>{work.tasks_count} tareas</span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                      <Link to={boardPath} style={linkBtnStyle}><FiArrowRight size={13} /> Kanban</Link>
                      <Link to={kpiPath} style={linkBtnStyle}><FiBarChart2 size={13} /> KPIs</Link>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                      <button style={iconBtnStyle} onClick={() => openEdit(work)}><FiEdit2 size={13} /></button>
                      <button style={{ ...iconBtnStyle, color: '#ef4444' }} onClick={() => deleteWork.mutate(work.id)}><FiTrash2 size={13} /></button>
                    </div>
                  </article>
                );
            })}

            {works.length === 0 && (
              <div style={{ ...workCardStyle, padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No hay obras en esta area.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const SummaryCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px' }}>
    <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    <div style={{ marginTop: '6px', fontSize: '30px', lineHeight: 1, fontWeight: 700, color }}>{value}</div>
  </div>
);

const formPanelStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '14px',
  padding: '16px',
  marginBottom: '14px',
};

const workCardStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  padding: '14px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--text)',
  padding: '9px 10px',
  fontSize: '13px',
  boxSizing: 'border-box',
};

const fieldLabelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '6px',
  color: 'var(--text-muted)',
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const primaryBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '7px',
  border: 'none',
  borderRadius: '9px',
  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  color: '#fff',
  padding: '10px 14px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 600,
};

const ghostBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '7px',
  border: '1px solid var(--border)',
  borderRadius: '9px',
  background: 'var(--surface)',
  color: 'var(--text-mid)',
  padding: '10px 14px',
  cursor: 'pointer',
  fontSize: '13px',
  textDecoration: 'none',
};

const linkBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '6px',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  color: 'var(--text-mid)',
  padding: '8px 10px',
  fontSize: '12px',
  textDecoration: 'none',
};

const iconBtnStyle: React.CSSProperties = {
  width: '28px',
  height: '28px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '7px',
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--text-muted)',
  cursor: 'pointer',
};


