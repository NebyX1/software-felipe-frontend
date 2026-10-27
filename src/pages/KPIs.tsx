import { useParams, Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { FiArrowLeft } from 'react-icons/fi';
import { useTasksByProject } from '../api/hooks/useTasks';
import { useProjectById } from '../api/hooks/useProjects';
import SemicircleGauge from '../components/common/SemicircleGauge';
import { STATUS_LABELS, PRIORITY_LABELS, STATUS_COLORS, PRIORITY_COLORS } from '../types';
import type { TaskStatus, TaskPriority } from '../types';

const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];
const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

const KPIs = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: tasks = [], isLoading } = useTasksByProject(projectId);
  const { data: project } = useProjectById(projectId);

  if (isLoading) {
    return (
      <div style={{ padding: '32px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ height: '24px', width: '180px', background: 'var(--skeleton)', borderRadius: '6px', marginBottom: '24px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {[1, 2, 3, 4].map(i => <div key={i} style={{ height: '280px', background: 'var(--skeleton)', borderRadius: '12px' }} />)}
        </div>
      </div>
    );
  }

  // Compute data
  const statusData = STATUSES.map(s => ({
    name: STATUS_LABELS[s],
    value: tasks.filter(t => t.status === s).length,
    color: STATUS_COLORS[s],
  })).filter(d => d.value > 0);

  const priorityData = PRIORITIES.map(p => ({
    name: PRIORITY_LABELS[p],
    value: tasks.filter(t => t.priority === p).length,
    color: PRIORITY_COLORS[p],
  })).filter(d => d.value > 0);

  const completionRate = tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0;

  // Overdue tasks
  const now = new Date();
  const overdueCount = tasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'done').length;

  // Responsible workload
  const responsibleMap: Record<string, number> = {};
  for (const t of tasks) {
    if (t.responsible) {
      responsibleMap[t.responsible] = (responsibleMap[t.responsible] || 0) + 1;
    }
  }
  const responsibleData = Object.entries(responsibleMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  return (
    <div style={{ maxWidth: 1380, margin: '0 auto', padding: '28px 24px 42px' }}>
      {/* Back link */}
      <Link to={`/board/${projectId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '12px', textDecoration: 'none', marginBottom: '16px', letterSpacing: '0.06em', transition: 'color 0.15s' }} onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-mid)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}>
        <FiArrowLeft size={12} /> Volver al tablero
      </Link>

      <h1 style={{ color: 'var(--text)', fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>KPIs — {project?.name || 'Proyecto'}</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '28px' }}>{tasks.length} tareas en total</p>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px', marginBottom: '30px' }}>
        {[
          { label: 'Total tareas', value: tasks.length, color: '#818cf8' },
          { label: 'Completadas', value: tasks.filter(t => t.status === 'done').length, color: '#4ade80' },
          { label: 'En progreso', value: tasks.filter(t => t.status === 'in_progress').length, color: '#38bdf8' },
          { label: 'Vencidas', value: overdueCount, color: '#ef4444' },
          { label: 'Tasa completitud', value: `${completionRate}%`, color: '#f59e0b' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '18px' }}>
        {/* Status Pie */}
        <ChartCard title="Estado de tareas">
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="43%" outerRadius={88} label={false}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  height={72}
                  iconType="circle"
                  wrapperStyle={{ paddingTop: '10px' }}
                  formatter={(value) => <span style={{ color: 'var(--text-mid)', fontSize: 12 }}>{value}</span>}
                />
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        {/* Priority Bar */}
        <ChartCard title="Distribución por prioridad">
          {priorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priorityData} margin={{ top: 8, right: 14, left: -10, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" interval={0} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        {/* Completion radial */}
        <ChartCard title="Tasa de completitud">
          <div style={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 12px 0' }}>
            <SemicircleGauge
              value={completionRate}
              min={0}
              max={100}
              label="Completado"
              size="100%"
              strokeWidth={9}
              color="#4ade80"
              backgroundColor="rgba(148, 163, 184, 0.18)"
            />
          </div>
        </ChartCard>

        {/* Responsible workload */}
        {responsibleData.length > 0 && (
          <ChartCard title="Carga por responsable">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={responsibleData} layout="vertical" margin={{ top: 6, right: 16, left: 24, bottom: 6 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <YAxis type="category" dataKey="name" interval={0} tick={{ fill: 'var(--text-mid)', fontSize: 12 }} width={160} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#818cf8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>
    </div>
  );
};

const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px 20px 16px', minHeight: 360, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
    <h3 style={{ color: 'var(--text-mid)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px' }}>{title}</h3>
    {children}
  </div>
);

const tooltipStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  color: 'var(--text)',
  fontSize: '12px',
};

const EmptyChart = () => (
  <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
    Sin datos
  </div>
);

export default KPIs;

