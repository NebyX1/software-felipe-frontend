import { useParams } from 'react-router-dom';
import { FiLock } from 'react-icons/fi';
import { useBoardData } from '../api/hooks/useTasks';
import ProjectTitle from '../components/board/ProjectTitle';
import Task from '../components/tasks/Task';
import TaskDetailModal from '../components/tasks/TaskDetailModal';
import type { Task as TaskType, TaskStatus } from '../types';
import { STATUS_LABELS, STATUS_COLORS } from '../types';
import { useState } from 'react';

const COLUMNS: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];

const ArchivedBoard = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { grouped, isLoading, isError } = useBoardData(projectId);
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);

  if (isLoading) {
    return (
      <div style={{ padding: '32px 24px' }}>
        <div style={{ height: '36px', width: '200px', background: 'var(--skeleton)', borderRadius: '6px', marginBottom: '32px' }} />
        <div style={{ display: 'flex', gap: '16px' }}>
          {COLUMNS.map(c => <div key={c} style={{ flex: 1, height: '300px', background: 'var(--muted-bg)', borderRadius: '12px' }} />)}
        </div>
      </div>
    );
  }

  if (isError) {
    return <div style={{ padding: '40px', color: '#ef4444', textAlign: 'center' }}>Error al cargar las tareas.</div>;
  }

  return (
    <div style={{ padding: '28px 24px' }}>
      <ProjectTitle projectId={projectId!} />

      {/* Read-only badge */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--muted-bg)', border: '1px solid var(--border)', borderRadius: '99px', padding: '4px 12px', marginBottom: '24px', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
        <FiLock size={11} /> Vista de sólo lectura — proyecto archivado
      </div>

      {/* Board columns */}
      <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px' }}>
        {COLUMNS.map(status => {
          const tasks = grouped[status];
          const color = STATUS_COLORS[status];
          const label = STATUS_LABELS[status];

          return (
            <div key={status} style={{ display: 'flex', flexDirection: 'column', minWidth: '240px', flex: 1, background: 'var(--column-bg)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: color }} />
                <span style={{ fontWeight: 600, fontSize: '11px', color: 'var(--text-mid)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', backgroundColor: 'var(--muted-bg)', padding: '1px 6px', borderRadius: '99px' }}>{tasks.length}</span>
              </div>

              {/* Tasks */}
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {tasks.map(task => (
                  <Task key={task.id} task={task} onClick={() => setSelectedTask(task)} />
                ))}
                {tasks.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '16px' }}>—</div>}
              </div>
            </div>
          );
        })}
      </div>

      {selectedTask && (
        <TaskDetailModal isOpen task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
};

export default ArchivedBoard;
