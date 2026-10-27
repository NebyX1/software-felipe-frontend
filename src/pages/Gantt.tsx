import { useParams, Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { FiArrowLeft, FiClock } from 'react-icons/fi';
import { useTasksByProject } from '../api/hooks/useTasks';
import { useProjectById } from '../api/hooks/useProjects';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '../types';
import type { Task } from '../types';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const daysBetween = (a: string, b: string) =>
  Math.max(1, Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / MS_PER_DAY));

// Returns how many days from the project start (first task) to this task's start
const daysOffset = (projectStart: Date, taskStart: string) =>
  Math.max(0, Math.floor((new Date(taskStart).getTime() - projectStart.getTime()) / MS_PER_DAY));

interface GanttRow {
  name: string;
  id: number;
  start: number;   // days from project start
  duration: number;
  color: string;
  priority: Task['priority'];
  due_date: string | null;
  status: Task['status'];
}

const Gantt = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: tasks = [], isLoading } = useTasksByProject(projectId);
  const { data: project } = useProjectById(projectId);

  if (isLoading) {
    return (
      <div style={{ padding: '32px 24px' }}>
        <div style={{ height: '24px', width: '180px', background: 'var(--skeleton)', borderRadius: '6px', marginBottom: '24px' }} />
        <div style={{ height: '400px', background: 'var(--skeleton)', borderRadius: '12px' }} />
      </div>
    );
  }

  // Filter tasks that have due_date
  const tasksWithDates = tasks.filter(t => t.due_date);

  if (tasksWithDates.length === 0) {
    return (
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 24px' }}>
        <Link to={`/board/${projectId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '12px', textDecoration: 'none', marginBottom: '16px' }} onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-mid)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}>
          <FiArrowLeft size={12} /> Volver al tablero
        </Link>
        <h1 style={{ color: 'var(--text)', fontSize: '22px', fontWeight: 700, marginBottom: '24px' }}>Gantt — {project?.name}</h1>
        <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-muted)', background: 'var(--muted-bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <FiClock size={32} style={{ marginBottom: '12px', opacity: 0.4 }} />
          <p>Ninguna tarea tiene fecha de vencimiento asignada.</p>
          <p style={{ fontSize: '12px', marginTop: '6px', color: 'var(--text-muted)' }}>Añade fechas de vencimiento en las tareas para ver el diagrama Gantt.</p>
        </div>
      </div>
    );
  }

  // Find the earliest creation date as project start
  const projectStart = tasksWithDates.reduce((earliest, t) => {
    const d = new Date(t.created_at);
    return d < earliest ? d : earliest;
  }, new Date(tasksWithDates[0].created_at));

  const rows: GanttRow[] = tasksWithDates.map(t => {
    const offset = daysOffset(projectStart, t.created_at);
    const duration = daysBetween(t.created_at, t.due_date!);
    return {
      name: t.title.length > 30 ? t.title.substring(0, 30) + '…' : t.title,
      id: t.id,
      start: offset,
      duration,
      color: PRIORITY_COLORS[t.priority] || '#6366f1',
      priority: t.priority,
      due_date: t.due_date,
      status: t.status,
    };
  });

  // Build stacked bar data: [empty placeholder, colored bar]
  const chartData = rows.map(r => ({
    name: r.name,
    'invisible': r.start,
    'Duración': r.duration,
    color: r.color,
    status: r.status,
  }));

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>
      <Link to={`/board/${projectId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '12px', textDecoration: 'none', marginBottom: '16px', letterSpacing: '0.06em', transition: 'color 0.15s' }} onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-mid)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}>
        <FiArrowLeft size={12} /> Volver al tablero
      </Link>

      <h1 style={{ color: 'var(--text)', fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>Gantt — {project?.name}</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>
        {tasksWithDates.length} tarea{tasksWithDates.length !== 1 ? 's' : ''} con fecha programada
      </p>

      {/* Legend: priority colors */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {(['low', 'medium', 'high', 'urgent'] as const).map(p => (
          <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: PRIORITY_COLORS[p] }} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{PRIORITY_LABELS[p]}</span>
          </div>
        ))}
      </div>

      {/* Gantt chart: horizontal stacked bar */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', overflowX: 'auto' }}>
        <ResponsiveContainer width="100%" height={Math.max(300, rows.length * 44)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
            barSize={20}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              label={{ value: 'Días desde inicio', position: 'insideBottom', offset: -2, fill: 'var(--text-muted)', fontSize: 11 }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: 'var(--text-mid)', fontSize: 11 }}
              width={160}
            />
            <Tooltip
              contentStyle={{ background: 'var(--tooltip-bg)', border: '1px solid var(--tooltip-border)', borderRadius: '8px', color: 'var(--text)', fontSize: '12px' }}
              formatter={(value: number | undefined, name: string | undefined) => name === 'Duración' && value != null ? [`${value} días`, 'Duración'] : null}
            />
            {/* Invisible offset bar */}
            <Bar dataKey="invisible" stackId="gantt" fill="transparent" radius={0} />
            {/* Colored duration bar */}
            <Bar dataKey="Duración" stackId="gantt" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Task list with dates */}
      <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {rows.map(row => {
          const overdue = row.due_date && new Date(row.due_date) < new Date() && row.status !== 'done';
          return (
            <div key={row.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--muted-bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '13px', color: 'var(--text)' }}>{row.name}</span>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: row.color, background: `${row.color}18`, padding: '1px 8px', borderRadius: '99px' }}>{PRIORITY_LABELS[row.priority]}</span>
                <span style={{ fontSize: '11px', color: overdue ? '#ef4444' : 'var(--text-muted)' }}>
                  Vence: {row.due_date ? new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(row.due_date)) : '—'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Gantt;

