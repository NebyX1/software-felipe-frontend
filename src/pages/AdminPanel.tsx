import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend,
} from 'recharts';
import {
  FiUsers, FiFolder, FiGrid, FiActivity, FiDownload,
  FiPlus, FiTrash2, FiRefreshCw, FiList, FiBarChart2, FiSettings,
} from 'react-icons/fi';
import { useDashboardFiltered, useActivityLogs, useExportProjects, useExportTasks } from '../api/hooks/useAdmin';
import { useUsers, useCreateUser, useDeactivateUser, useResetUserPassword } from '../api/hooks/useUsers';
import { useUnits, useCreateUnit, useDeleteUnit, useUpdateUnit } from '../api/hooks/useUnits';
import { createUserSchema, type CreateUserSchema, createUnitSchema, type CreateUnitSchema } from '../schemas';
import useAuth from '../store/useAuth';
import { STATUS_COLORS, STATUS_LABELS, PRIORITY_COLORS, PRIORITY_LABELS } from '../types';
import type { TaskStatus, TaskPriority } from '../types';

type Tab = 'overview' | 'users' | 'units' | 'logs' | 'exports';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Panel', icon: FiBarChart2 },
  { id: 'users', label: 'Usuarios', icon: FiUsers },
  { id: 'units', label: 'Unidades', icon: FiGrid },
  { id: 'logs', label: 'Auditoría', icon: FiList },
  { id: 'exports', label: 'Exportar', icon: FiDownload },
];

const UNIT_COLOR_PALETTE = [
  '#2563eb', '#1d4ed8', '#0ea5e9', '#0284c7', '#06b6d4', '#0891b2',
  '#10b981', '#059669', '#22c55e', '#16a34a', '#84cc16', '#65a30d',
  '#f59e0b', '#d97706', '#f97316', '#ea580c', '#ef4444', '#dc2626',
  '#ec4899', '#db2777', '#d946ef', '#c026d3', '#8b5cf6', '#7c3aed',
  '#6366f1', '#4f46e5', '#14b8a6', '#0f766e', '#64748b', '#334155',
];

const UNIT_EMOJI_OPTIONS = [
  // Gobierno / administración
  '🏛️', '🏢', '🗳️', '📜', '⚖️', '🛡️', '👮', '🤝', '📣', '📋',
  '📑', '🗂️', '🗃️', '📊', '📈', '📉', '🔖', '🖊️', '🖋️', '✒️',
  // Tecnología / informática
  '💻', '🖥️', '🖨️', '⌨️', '🖱️', '🖧', '📡', '📱', '🔌', '🔋',
  '💾', '💿', '📀', '🛜', '🔐', '🔒', '🔓', '🧮', '📲', '🤖',
  // Obras / infraestructura
  '🏗️', '🧱', '🚧', '🛣️', '🛤️', '🌉', '🏚️', '🏠', '🏘️', '🏭',
  '⚙️', '🔧', '🔨', '🪛', '🔩', '🪝', '🧰', '📐', '📏', '🪜',
  // Transporte
  '🚌', '🚎', '🚑', '🚒', '🚓', '🚚', '🚲', '🛵', '🚦', '🅿️',
  // Medio ambiente
  '🌳', '🌱', '🌿', '🌾', '💧', '🚰', '♻️', '🌊', '🌤️', '🌻',
  // Energía / servicios
  '⚡', '💡', '🔦', '🕯️', '🔥', '🧯', '🚒', '🪣', '🧹', '🗑️',
  // Salud
  '🏥', '🩺', '💊', '🩹', '🧬', '🔬', '🩻', '🫀', '🧪', '🩸',
  // Educación / cultura
  '🏫', '📚', '📖', '✏️', '🎓', '🎭', '🎨', '🎼', '🏟️', '🎯',
  // Personas / social
  '👷', '🧑‍💼', '👩‍🔬', '🧑‍🏫', '🧑‍⚕️', '🧑‍🔧', '🧑‍💻', '🫂', '🧕', '🌍',
  // Deporte / recreación
  '⚽', '🏀', '🏐', '🏊', '🏕️', '🗺️', '🏖️', '🧳', '🎪', '🏆',
];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', background: 'var(--muted-bg)',
  border: '1px solid var(--border-bright)', borderRadius: '8px',
  color: 'var(--text)', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)',
  marginBottom: '5px', letterSpacing: '0.05em', textTransform: 'uppercase',
};

// ─── Overview tab ─────────────────────────────────────────────────────────────

const OverviewTab = () => {
  const [selectedUnitId, setSelectedUnitId] = useState<number | ''>('');
  const dashboardParams = selectedUnitId === '' ? undefined : { unit_id: Number(selectedUnitId) };
  const { data, isLoading, isError, refetch } = useDashboardFiltered(dashboardParams);
  if (isLoading) return <LoadingState />;
  if (isError) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--text-mid)', padding: '40px 20px' }}>
        <div style={{ marginBottom: '10px' }}>No se pudo cargar el panel de administración.</div>
        <button onClick={() => void refetch()} style={cancelBtnStyle}>
          <FiRefreshCw size={13} /> Reintentar
        </button>
      </div>
    );
  }
  if (!data) return <NoData />;

  const { stats, units } = data;

  const statusChartData = (Object.entries(stats.tasks_by_status) as [TaskStatus, number][]).map(([k, v]) => ({
    name: STATUS_LABELS[k], value: v, color: STATUS_COLORS[k],
  })).filter(d => d.value > 0);

  const priorityChartData = (Object.entries(stats.tasks_by_priority) as [TaskPriority, number][]).map(([k, v]) => ({
    name: PRIORITY_LABELS[k], value: v, color: PRIORITY_COLORS[k],
  })).filter(d => d.value > 0);

  const unitChartData = units.map(u => ({
    name: u.name.length > 12 ? u.name.substring(0, 12) + '…' : u.name,
    activos: u.active_projects,
    archivados: u.archived_projects,
    fill: u.color || '#6366f1',
  }));

  const summaryCards = [
    { label: 'Usuarios', value: stats.total_users, icon: FiUsers, color: '#818cf8' },
    { label: 'Unidades', value: stats.total_units, icon: FiGrid, color: '#38bdf8' },
    { label: 'Proyectos activos', value: stats.total_projects, icon: FiFolder, color: '#4ade80' },
    { label: 'Tareas totales', value: stats.total_tasks, icon: FiActivity, color: '#f59e0b' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <h2 style={{ color: 'var(--text)', fontSize: '16px', fontWeight: 700, margin: 0 }}>Resumen del panel</h2>
        <div style={{ minWidth: '260px' }}>
          <label style={labelStyle}>Filtrar tareas por área</label>
          <select
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value === '' ? '' : Number(e.target.value))}
            style={{ ...inputStyle, appearance: 'none' }}
          >
            <option value="">Todas las áreas</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px' }}>
        {summaryCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Icon size={14} color={color} />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
            </div>
            <div style={{ fontSize: '26px', fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {/* Status pie */}
        <ChartCard title="Tareas por estado">
          {statusChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                  {statusChartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" iconSize={9} formatter={(v) => <span style={{ fontSize: 11, color: 'var(--text-mid)' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>

        {/* Priority bar */}
        <ChartCard title="Tareas por prioridad">
          {priorityChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={priorityChartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {priorityChartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>

        {/* Projects per unit */}
        {unitChartData.length > 0 && (
          <ChartCard title="Proyectos por unidad">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={unitChartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="activos" fill="#4ade80" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="archivados" fill="#64748b" stackId="a" radius={[4, 4, 0, 0]} />
                <Legend iconType="rect" iconSize={9} formatter={(v) => <span style={{ fontSize: 11, color: 'var(--text-mid)' }}>{v}</span>} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>
    </div>
  );
};

// ─── Users tab ────────────────────────────────────────────────────────────────

const UsersTab = () => {
  const currentUser = useAuth((s) => s.user);
  const { data: users = [], isLoading } = useUsers();
  const { data: units = [] } = useUnits();
  const createUser = useCreateUser();
  const deactivate = useDeactivateUser();
  const resetPwd = useResetUserPassword();
  const [showCreate, setShowCreate] = useState(false);
  const [resetInfo, setResetInfo] = useState<{ name: string; pwd: string } | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CreateUserSchema>({
    resolver: zodResolver(createUserSchema) as never,
    defaultValues: { role: 'user' },
  });

  const onSubmit = (data: CreateUserSchema) => {
    createUser.mutate(data, { onSuccess: () => { reset(); setShowCreate(false); } });
  };

  const handleResetPwd = (id: number, name: string) => {
    resetPwd.mutate({ id }, {
      onSuccess: (res) => setResetInfo({ name, pwd: res.new_password }),
    });
  };

  if (isLoading) return <LoadingState />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <span style={{ color: 'var(--text-mid)', fontSize: '13px' }}>{users.length} usuarios registrados</span>
        <button onClick={() => setShowCreate(!showCreate)} style={primaryBtnStyle}>
          <FiPlus size={13} /> Nuevo usuario
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ color: 'var(--text)', fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Crear usuario</h3>
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Nombre *</label>
              <input {...register('name')} style={inputStyle} />
              {errors.name && <Err msg={errors.name.message} />}
            </div>
            <div>
              <label style={labelStyle}>Email *</label>
              <input type="email" {...register('email')} style={inputStyle} />
              {errors.email && <Err msg={errors.email.message} />}
            </div>
            <div>
              <label style={labelStyle}>Contraseña *</label>
              <input type="password" {...register('password')} style={inputStyle} />
              {errors.password && <Err msg={errors.password.message} />}
            </div>
            <div>
              <label style={labelStyle}>Rol</label>
              <select {...register('role')} style={{ ...inputStyle, appearance: 'none' }}>
                <option value="user">Usuario</option>
                <option value="admin">Admin</option>
                {currentUser?.role === 'super_admin' && <option value="super_admin">Super Admin</option>}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Unidad</label>
              <select {...register('unit_id', { valueAsNumber: true })} style={{ ...inputStyle, appearance: 'none' }}>
                <option value="">Sin asignar</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowCreate(false)} style={cancelBtnStyle}>Cancelar</button>
              <button type="submit" disabled={createUser.isPending} style={primaryBtnStyle}>{createUser.isPending ? 'Creando...' : 'Crear'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Reset info popup */}
      {resetInfo && (
        <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '10px', padding: '14px 18px', marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text)' }}>
            🔑 Nueva contraseña para <strong>{resetInfo.name}</strong>: <code style={{ background: 'var(--muted-bg)', padding: '2px 8px', borderRadius: '4px', color: '#fbbf24' }}>{resetInfo.pwd}</code>
          </span>
          <button onClick={() => setResetInfo(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}>×</button>
        </div>
      )}

      {/* Users table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--divider)' }}>
              {['Nombre', 'Email', 'Rol', 'Unidad', 'Estado', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--divider)' }}>
                <td style={{ padding: '12px', color: 'var(--text)' }}>{u.name}</td>
                <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{u.email}</td>
                <td style={{ padding: '12px' }}>
                  <RoleBadge role={u.role} />
                </td>
                <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{u.unit_name || '—'}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '99px', background: u.is_active ? 'rgba(74,222,128,0.12)' : 'rgba(239,68,68,0.12)', color: u.is_active ? '#4ade80' : '#ef4444', border: `1px solid ${u.is_active ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                    {u.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => handleResetPwd(u.id, u.name)} title="Resetear contraseña" style={iconBtnStyle}>
                      <FiRefreshCw size={13} />
                    </button>
                    {u.id !== currentUser?.id && (
                      <button onClick={() => deactivate.mutate(u.id)} title="Desactivar" style={{ ...iconBtnStyle, color: '#ef4444' }}>
                        <FiTrash2 size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Units tab ────────────────────────────────────────────────────────────────

const UnitsTab = () => {
  const currentUser = useAuth((s) => s.user);
  const canManageUnits = currentUser?.role === 'super_admin';
  const { data: units = [], isLoading } = useUnits();
  const createUnit = useCreateUnit();
  const updateUnit = useUpdateUnit();
  const deleteUnit = useDeleteUnit();
  const [showCreate, setShowCreate] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState<number | null>(null);

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<CreateUnitSchema>({
    resolver: zodResolver(createUnitSchema) as never,
    defaultValues: { color: '#6366f1', emoji: '🏛️' },
  });

  const selectedColor = watch('color');
  const selectedEmoji = watch('emoji');

  const onSubmit = (data: CreateUnitSchema) => {
    if (editingUnitId) {
      updateUnit.mutate({ id: editingUnitId, data }, {
        onSuccess: () => {
          reset({ color: '#6366f1', emoji: '🏛️' });
          setShowCreate(false);
          setEditingUnitId(null);
        },
      });
      return;
    }

    createUnit.mutate(data, {
      onSuccess: () => {
        reset({ color: '#6366f1', emoji: '🏛️' });
        setShowCreate(false);
      },
    });
  };

  const handleEdit = (unit: { id: number; name: string; description: string | null; color: string; emoji: string }) => {
    setEditingUnitId(unit.id);
    setShowCreate(true);
    setValue('name', unit.name);
    setValue('description', unit.description ?? '');
    setValue('color', unit.color || '#6366f1');
    setValue('emoji', unit.emoji || '🏛️');
  };

  if (isLoading) return <LoadingState />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <span style={{ color: 'var(--text-mid)', fontSize: '13px' }}>{units.length} unidades</span>
        {canManageUnits && (
          <button onClick={() => { setEditingUnitId(null); reset({ color: '#6366f1', emoji: '🏛️' }); setShowCreate(!showCreate); }} style={primaryBtnStyle}>
            <FiPlus size={13} /> Nueva unidad
          </button>
        )}
      </div>

      {!canManageUnits && (
        <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', color: '#fbbf24', fontSize: '12px' }}>
          Solo el super administrador puede crear, editar o eliminar áreas.
        </div>
      )}

      {showCreate && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Nombre *</label>
              <input {...register('name')} style={inputStyle} placeholder="Ej: Dirección de Obras" />
              {errors.name && <Err msg={errors.name.message} />}
            </div>
            <div>
              <label style={labelStyle}>Color</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                <input type="color" {...register('color')} style={{ width: '40px', height: '38px', padding: '2px', background: 'transparent', border: '1px solid var(--border-bright)', borderRadius: '6px', cursor: 'pointer' }} />
                <input {...register('color')} style={{ ...inputStyle, flex: 1 }} placeholder="#6366f1" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '6px' }}>
                {UNIT_COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setValue('color', c)}
                    style={{
                      width: '100%',
                      aspectRatio: '1 / 1',
                      borderRadius: '6px',
                      border: selectedColor === c ? '2px solid var(--text)' : '1px solid var(--border-bright)',
                      background: c,
                      cursor: 'pointer',
                    }}
                    title={c}
                  />
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Emoji del área</label>
              <input {...register('emoji')} style={{ ...inputStyle, marginBottom: '8px' }} placeholder="🏛️" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '6px', maxHeight: '132px', overflowY: 'auto', paddingRight: '4px' }}>
                {UNIT_EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setValue('emoji', emoji)}
                    style={{
                      borderRadius: '6px',
                      border: selectedEmoji === emoji ? '1px solid #818cf8' : '1px solid var(--border)',
                      background: selectedEmoji === emoji ? 'rgba(129,140,248,0.2)' : 'var(--muted-bg)',
                      fontSize: '18px',
                      padding: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Descripción</label>
              <input {...register('description')} style={inputStyle} placeholder="Descripción opcional..." />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setShowCreate(false); setEditingUnitId(null); }} style={cancelBtnStyle}>Cancelar</button>
              <button type="submit" disabled={createUnit.isPending || updateUnit.isPending} style={primaryBtnStyle}>
                {editingUnitId ? (updateUnit.isPending ? 'Guardando...' : 'Guardar cambios') : (createUnit.isPending ? 'Creando...' : 'Crear')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gap: '10px' }}>
        {units.map(u => (
          <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--muted-bg)', border: '1px solid var(--border)', borderRadius: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '8px', backgroundColor: `${u.color || '#6366f1'}22`, border: `1px solid ${u.color || '#6366f1'}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '16px' }}>
                {u.emoji || '🏛️'}
              </div>
              <div>
                <div style={{ color: 'var(--text)', fontSize: '14px', fontWeight: 500 }}>{u.name}</div>
                {u.description && <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>{u.description}</div>}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.project_count} proyectos · {u.user_count} usuarios</div>
              {canManageUnits && (
                <button onClick={() => handleEdit(u)} title="Editar" style={iconBtnStyle}>
                  <FiSettings size={13} />
                </button>
              )}
              {canManageUnits && u.project_count === 0 && (
                <button onClick={() => deleteUnit.mutate(u.id)} title="Eliminar" style={{ ...iconBtnStyle, color: '#ef4444' }}>
                  <FiTrash2 size={13} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Logs tab ─────────────────────────────────────────────────────────────────

const LogsTab = () => {
  const currentUser = useAuth((s) => s.user);
  const [page, setPage] = useState(1);

  if (currentUser?.role !== 'super_admin') {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Solo los Super Admins pueden ver el registro de auditoría.</div>;
  }

  return <LogsContent page={page} setPage={setPage} />;
};

const LogsContent = ({ page, setPage }: { page: number; setPage: (p: number) => void }) => {
  const { data, isLoading, isError, refetch } = useActivityLogs({ page, per_page: 20 });

  if (isLoading) return <LoadingState />;
  if (isError) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--text-mid)', padding: '40px 20px' }}>
        <div style={{ marginBottom: '10px' }}>No se pudo cargar la auditoría.</div>
        <button onClick={() => void refetch()} style={cancelBtnStyle}>
          <FiRefreshCw size={13} /> Reintentar
        </button>
      </div>
    );
  }
  if (!data) return null;

  const dateFormatter = new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'short' });
  const fmtDate = (d?: string | null) => {
    if (!d) return '—';
    const parsed = new Date(d);
    if (Number.isNaN(parsed.getTime())) return '—';
    return dateFormatter.format(parsed);
  };

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--divider)' }}>
              {['Fecha', 'Usuario', 'Acción', 'Entidad', 'IP'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.logs.map(log => (
              <tr key={log.id} style={{ borderBottom: '1px solid var(--divider)' }}>
                <td style={{ padding: '10px 12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtDate(log.created_at ?? log.timestamp)}</td>
                <td style={{ padding: '10px 12px', color: 'var(--text-mid)' }}>{log.user_name}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '99px', background: 'rgba(129,140,248,0.1)', color: '#818cf8', border: '1px solid rgba(129,140,248,0.2)' }}>{log.action}</span>
                </td>
                <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{log.entity_type || '—'} {log.entity_id ? `#${log.entity_id}` : ''}</td>
                <td style={{ padding: '10px 12px', color: 'var(--text-mid)', fontFamily: 'monospace', fontSize: '11px' }}>{log.ip_address || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Página {data.pagination.page} de {data.pagination.pages} ({data.pagination.total} registros)
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={{ ...cancelBtnStyle, opacity: page <= 1 ? 0.4 : 1 }}>← Anterior</button>
          <button disabled={page >= data.pagination.pages} onClick={() => setPage(page + 1)} style={{ ...cancelBtnStyle, opacity: page >= data.pagination.pages ? 0.4 : 1 }}>Siguiente →</button>
        </div>
      </div>
    </div>
  );
};

// ─── Exports tab ──────────────────────────────────────────────────────────────

const ExportsTab = () => {
  const { data: units = [] } = useUnits();
  const { exportProjects } = useExportProjects();
  const { exportTasks } = useExportTasks();
  const [projFilters, setProjFilters] = useState({ unit_id: '', archived: '', date_from: '', date_to: '' });
  const [taskFilters, setTaskFilters] = useState({ unit_id: '', status: '', priority: '', date_from: '', date_to: '' });
  const [loading, setLoading] = useState<'projects' | 'tasks' | null>(null);

  const handleExport = async (type: 'projects' | 'tasks') => {
    setLoading(type);
    try {
      if (type === 'projects') {
        await exportProjects(Object.fromEntries(Object.entries(projFilters).filter(([, v]) => v !== '')));
      } else {
        await exportTasks(Object.fromEntries(Object.entries(taskFilters).filter(([, v]) => v !== '')));
      }
    } finally {
      setLoading(null);
    }
  };

  const FilterInput = ({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
    <div>
      <label style={labelStyle}>{label}</label>
      <input style={inputStyle} {...props} />
    </div>
  );

  const FilterSelect = ({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) => (
    <div>
      <label style={labelStyle}>{label}</label>
      <select style={{ ...inputStyle, appearance: 'none' }} {...props}>{children}</select>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Projects export */}
      <ExportSection title="Exportar proyectos" subtitle="Descarga un CSV con todos los proyectos filtrados">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          <FilterSelect label="Unidad" value={projFilters.unit_id} onChange={e => setProjFilters(f => ({ ...f, unit_id: e.target.value }))}>
            <option value="">Todas</option>
            {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </FilterSelect>
          <FilterSelect label="Estado" value={projFilters.archived} onChange={e => setProjFilters(f => ({ ...f, archived: e.target.value }))}>
            <option value="">Todos</option>
            <option value="false">Activos</option>
            <option value="true">Archivados</option>
          </FilterSelect>
          <FilterInput label="Desde" type="date" value={projFilters.date_from} onChange={e => setProjFilters(f => ({ ...f, date_from: e.target.value }))} />
          <FilterInput label="Hasta" type="date" value={projFilters.date_to} onChange={e => setProjFilters(f => ({ ...f, date_to: e.target.value }))} />
        </div>
        <button onClick={() => handleExport('projects')} disabled={loading === 'projects'} style={primaryBtnStyle}>
          <FiDownload size={13} /> {loading === 'projects' ? 'Exportando...' : 'Descargar CSV de proyectos'}
        </button>
      </ExportSection>

      {/* Tasks export */}
      <ExportSection title="Exportar tareas" subtitle="Descarga un CSV con todas las tareas filtradas">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          <FilterSelect label="Unidad" value={taskFilters.unit_id} onChange={e => setTaskFilters(f => ({ ...f, unit_id: e.target.value }))}>
            <option value="">Todas</option>
            {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </FilterSelect>
          <FilterSelect label="Estado" value={taskFilters.status} onChange={e => setTaskFilters(f => ({ ...f, status: e.target.value }))}>
            <option value="">Todos</option>
            <option value="todo">Por hacer</option>
            <option value="in_progress">En progreso</option>
            <option value="review">En revisión</option>
            <option value="done">Terminado</option>
          </FilterSelect>
          <FilterSelect label="Prioridad" value={taskFilters.priority} onChange={e => setTaskFilters(f => ({ ...f, priority: e.target.value }))}>
            <option value="">Todas</option>
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </FilterSelect>
          <FilterInput label="Desde" type="date" value={taskFilters.date_from} onChange={e => setTaskFilters(f => ({ ...f, date_from: e.target.value }))} />
          <FilterInput label="Hasta" type="date" value={taskFilters.date_to} onChange={e => setTaskFilters(f => ({ ...f, date_to: e.target.value }))} />
        </div>
        <button onClick={() => handleExport('tasks')} disabled={loading === 'tasks'} style={primaryBtnStyle}>
          <FiDownload size={13} /> {loading === 'tasks' ? 'Exportando...' : 'Descargar CSV de tareas'}
        </button>
      </ExportSection>
    </div>
  );
};

// ─── AdminPanel ───────────────────────────────────────────────────────────────

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const user = useAuth((s) => s.user);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
        <FiSettings size={18} color="#818cf8" />
        <div>
          <h1 style={{ color: 'var(--text)', fontSize: '22px', fontWeight: 700, margin: 0 }}>Panel de administración</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>{user?.role === 'super_admin' ? 'Super Administrador' : 'Administrador'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2px', marginBottom: '24px', background: 'var(--muted-bg)', borderRadius: '10px', padding: '4px', border: '1px solid var(--border)', flexWrap: 'wrap' }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 500, transition: 'all 0.15s',
              background: activeTab === id ? 'rgba(99,102,241,0.25)' : 'transparent',
              color: activeTab === id ? 'var(--text)' : 'var(--text-muted)',
            }}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'units' && <UnitsTab />}
      {activeTab === 'logs' && <LogsTab />}
      {activeTab === 'exports' && <ExportsTab />}
    </div>
  );
};

// ─── Shared helpers ───────────────────────────────────────────────────────────

const tooltipStyle: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: '8px', color: 'var(--text)', fontSize: '12px',
};

const primaryBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 18px',
  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: '8px',
  color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '8px 16px', background: 'var(--muted-bg)',
  border: '1px solid var(--border)', borderRadius: '8px',
  color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer',
};

const iconBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
  padding: '5px', borderRadius: '5px', transition: 'color 0.15s, background 0.15s',
};

const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px' }}>
    <h3 style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>{title}</h3>
    {children}
  </div>
);

const ExportSection = ({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) => (
  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '22px' }}>
    <h3 style={{ color: 'var(--text)', fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>{title}</h3>
    <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '16px' }}>{subtitle}</p>
    {children}
  </div>
);

const RoleBadge = ({ role }: { role: string }) => {
  const cfg: Record<string, { label: string; color: string }> = {
    super_admin: { label: 'Super Admin', color: '#f59e0b' },
    admin: { label: 'Admin', color: '#818cf8' },
    user: { label: 'Usuario', color: '#4ade80' },
  };
  const { label, color } = cfg[role] || { label: role, color: '#94a3b8' };
  return <span style={{ fontSize: '10px', padding: '2px 9px', borderRadius: '99px', background: `${color}18`, color, border: `1px solid ${color}30` }}>{label}</span>;
};

const Err = ({ msg }: { msg?: string }) => msg ? <span style={{ color: '#ef4444', fontSize: '11px', marginTop: '3px', display: 'block' }}>{msg}</span> : null;
const LoadingState = () => <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-mid)', fontSize: '13px' }}>Cargando...</div>;
const NoData = () => <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-mid)', fontSize: '12px' }}>Sin datos suficientes</div>;

export default AdminPanel;
