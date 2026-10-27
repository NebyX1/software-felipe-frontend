import { Link, useParams } from 'react-router-dom';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { FiArrowLeft, FiHardDrive } from 'react-icons/fi';
import { useWorks, useWorkKpis } from '../api/hooks/useWorks';
import { useUnits } from '../api/hooks/useUnits';
import SemicircleGauge from '../components/common/SemicircleGauge';
import useAuth from '../store/useAuth';

const STATUS_COLORS: Record<string, string> = {
  todo: '#64748b',
  in_progress: '#3b82f6',
  review: '#8b5cf6',
  blocked: '#ef4444',
  done: '#22c55e',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  todo: 'Por hacer',
  in_progress: 'En curso',
  review: 'Revision',
  blocked: 'Bloqueada',
  done: 'Finalizada',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Critica',
};

const WorkKPIs = () => {
  const user = useAuth((s) => s.user);
  const { workId, unitId } = useParams<{ workId: string; unitId?: string }>();
  const parsedWorkId = Number(workId);
  const selectedUnitId = unitId ? Number(unitId) : user?.unit_id ?? undefined;
  const isAdminView = user?.role === 'admin' || user?.role === 'super_admin';

  const { data: units = [] } = useUnits();
  const { data: works = [] } = useWorks(selectedUnitId);
  const { data, isLoading, isError } = useWorkKpis(parsedWorkId);

  const unit = units.find((u) => u.id === selectedUnitId);
  const work = works.find((w) => w.id === parsedWorkId);

  if (isLoading) {
    return <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px', color: 'var(--text-muted)' }}>Cargando KPIs de obra...</div>;
  }

  if (isError || !data) {
    return <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px', color: '#ef4444' }}>No se pudieron cargar los KPIs.</div>;
  }

  const statusData = Object.entries(data.by_status).map(([status, value]) => ({
    name: STATUS_LABELS[status] || status,
    value,
    color: STATUS_COLORS[status] || '#64748b',
  }));

  const priorityData = Object.entries(data.by_priority).map(([priority, value]) => ({
    name: PRIORITY_LABELS[priority] || priority,
    value,
    color: PRIORITY_COLORS[priority] || '#64748b',
  }));

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '30px 22px 42px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text)', fontSize: 'clamp(26px, 3.8vw, 36px)' }}>
            KPIs tecnicos de obra
          </h1>
          <p style={{ marginTop: '9px', color: 'var(--text-mid)', fontSize: '14px' }}>
            {work?.title || 'Obra'} · {unit?.name || user?.unit_name || 'Area'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '9px', flexWrap: 'wrap' }}>
          <Link to={isAdminView ? `/admin/areas/${selectedUnitId}/works/${parsedWorkId}/board` : `/works/${parsedWorkId}/board`} style={ghostBtnStyle}>
            <FiHardDrive size={13} /> Kanban
          </Link>
          <Link to={isAdminView ? `/admin/areas/${selectedUnitId}/works` : '/works'} style={ghostBtnStyle}>
            <FiArrowLeft size={13} /> Volver
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px', marginBottom: '14px' }}>
        <MetricCard label='Total tareas' value={data.kpis.total_tasks} color='#3b82f6' />
        <MetricCard label='Finalizadas' value={data.kpis.done_tasks} color='#22c55e' />
        <MetricCard label='Cumplimiento %' value={data.kpis.completion_rate} color='#8b5cf6' suffix='%' />
        <MetricCard label='Avance promedio' value={data.kpis.avg_progress} color='#f59e0b' suffix='%' />
        <MetricCard label='Docs generales' value={data.kpis.documents_count} color='#ef4444' />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <section style={panelStyle}>
          <h3 style={{ marginTop: 0, color: 'var(--text)', fontSize: '14px' }}>Distribucion por estado</h3>
          {statusData.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Sin datos.</div>
          ) : (
            <ResponsiveContainer width='100%' height={300}>
              <PieChart>
                <Pie data={statusData} dataKey='value' nameKey='name' outerRadius={100} label>
                  {statusData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </section>

        <section style={panelStyle}>
          <h3 style={{ marginTop: 0, color: 'var(--text)', fontSize: '14px' }}>Distribucion por prioridad</h3>
          {priorityData.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Sin datos.</div>
          ) : (
            <ResponsiveContainer width='100%' height={300}>
              <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray='3 3' stroke='var(--chart-grid)' />
                <XAxis dataKey='name' tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey='value' radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginTop: '12px' }}>
        <section style={panelStyle}>
          <SemicircleGauge
            value={data.kpis.completion_rate}
            min={0}
            max={100}
            label='Cumplimiento'
            size='100%'
            strokeWidth={9}
            color='#8b5cf6'
            backgroundColor='rgba(148, 163, 184, 0.18)'
          />
        </section>

        <section style={panelStyle}>
          <SemicircleGauge
            value={data.kpis.avg_progress}
            min={0}
            max={100}
            label='Avance promedio'
            size='100%'
            strokeWidth={9}
            color='#f59e0b'
            backgroundColor='rgba(148, 163, 184, 0.18)'
          />
        </section>
      </div>
    </div>
  );
};

const MetricCard = ({
  label,
  value,
  color,
  suffix,
}: {
  label: string;
  value: number;
  color: string;
  suffix?: string;
}) => (
  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px' }}>
    <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    <div style={{ marginTop: '7px', fontSize: '28px', fontWeight: 700, color }}>
      {value}{suffix || ''}
    </div>
  </div>
);

const panelStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  padding: '12px',
};

const ghostBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '7px',
  border: '1px solid var(--border)',
  borderRadius: '9px',
  background: 'var(--surface)',
  color: 'var(--text-mid)',
  padding: '9px 14px',
  cursor: 'pointer',
  fontSize: '13px',
  textDecoration: 'none',
};

const tooltipStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  color: 'var(--text)',
  fontSize: '12px',
};

export default WorkKPIs;
