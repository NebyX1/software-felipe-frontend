import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FiPlus } from 'react-icons/fi';
import { useBoardData, useUpdateTaskStatus } from '../api/hooks/useTasks';
import ProjectTitle from '../components/board/ProjectTitle';
import Task from '../components/tasks/Task';
import CreateTaskModal from '../components/tasks/CreateTaskModal';
import UpdateTaskModal from '../components/tasks/UpdateTaskModal';
import DeleteTaskModal from '../components/tasks/DeleteTaskModal';
import type { Task as TaskType, TaskStatus } from '../types';
import { STATUS_LABELS, STATUS_COLORS } from '../types';

const COLUMNS: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];

// ─── Sortable Task ────────────────────────────────────────────────────────────

interface SortableTaskProps {
  task: TaskType;
  onEdit: (task: TaskType) => void;
  onDelete: (task: TaskType) => void;
}

const SortableTask = ({ task, onEdit, onDelete }: SortableTaskProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      {...attributes}
      {...listeners}
    >
      <Task
        task={task}
        onClick={() => onEdit(task)}
      />
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(task); }}
        style={{ display: 'block', width: '100%', marginTop: '4px', padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '0.06em', textTransform: 'uppercase', transition: 'color 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
      >
        Eliminar
      </button>
    </div>
  );
};

// ─── Column ───────────────────────────────────────────────────────────────────

interface ColumnProps {
  status: TaskStatus;
  tasks: TaskType[];
  onAddTask: (status: TaskStatus) => void;
  onEdit: (task: TaskType) => void;
  onDelete: (task: TaskType) => void;
}

const Column = ({ status, tasks, onAddTask, onEdit, onDelete }: ColumnProps) => {
  const color = STATUS_COLORS[status];
  const label = STATUS_LABELS[status];
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: '260px', flex: 1, background: 'var(--column-bg)', backdropFilter: 'blur(8px)', borderRadius: '12px', border: `1px solid ${isOver ? 'rgba(99,102,241,0.5)' : 'var(--border)'}`, overflow: 'hidden', transition: 'border-color 0.15s', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      {/* Column header */}
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }} />
          <span style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', backgroundColor: 'var(--muted-bg)', padding: '1px 7px', borderRadius: '99px' }}>{tasks.length}</span>
        </div>
        <button
          onClick={() => onAddTask(status)}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '3px', transition: 'color 0.15s', borderRadius: '4px' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#818cf8'; e.currentTarget.style.background = 'rgba(129,140,248,0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
          title="Agregar tarea"
        >
          <FiPlus size={15} />
        </button>
      </div>

      {/* Tasks */}
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          style={{
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            flex: 1,
            minHeight: '80px',
            background: isOver && tasks.length === 0 ? 'rgba(99,102,241,0.06)' : undefined,
            borderRadius: '8px',
            transition: 'background 0.15s',
          }}
        >
          {tasks.map(task => (
            <SortableTask key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

// ─── Board ────────────────────────────────────────────────────────────────────

const Board = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { grouped, isLoading, isError } = useBoardData(projectId);
  const updateStatus = useUpdateTaskStatus();

  const [activeTask, setActiveTask] = useState<TaskType | null>(null);
  const [createStatus, setCreateStatus] = useState<TaskStatus | null>(null);
  const [editTask, setEditTask] = useState<TaskType | null>(null);
  const [deleteTask, setDeleteTask] = useState<TaskType | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const allTasks = [...grouped.todo, ...grouped.in_progress, ...grouped.review, ...grouped.done];

  const onDragStart = (event: DragStartEvent) => {
    setActiveTask(allTasks.find(t => t.id === event.active.id) ?? null);
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const draggedTask = allTasks.find(t => t.id === active.id);
    if (!draggedTask) return;

    // Detect which column the task was dropped into
    const overTask = allTasks.find(t => t.id === over.id);
    let targetStatus: TaskStatus | undefined;

    if (overTask) {
      targetStatus = overTask.status;
    } else {
      // Dropped on a column id (which is the status string)
      const asStatus = over.id as string;
      if (COLUMNS.includes(asStatus as TaskStatus)) {
        targetStatus = asStatus as TaskStatus;
      }
    }

    if (targetStatus && targetStatus !== draggedTask.status) {
      updateStatus.mutate({ taskId: draggedTask.id, newStatus: targetStatus, projectId: projectId! });
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '32px 24px' }}>
        <div style={{ height: '36px', width: '200px', background: 'var(--skeleton)', borderRadius: '6px', marginBottom: '32px' }} />
        <div style={{ display: 'flex', gap: '16px' }}>
          {COLUMNS.map(c => <div key={c} style={{ flex: 1, height: '400px', background: 'var(--muted-bg)', borderRadius: '12px' }} />)}
        </div>
      </div>
    );
  }

  if (isError) {
    return <div style={{ padding: '40px', color: '#ef4444', textAlign: 'center' }}>Error al cargar las tareas.</div>;
  }

  return (
    <div style={{ padding: '28px 24px', minHeight: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', gap: '16px', flexWrap: 'wrap' }}>
        <ProjectTitle projectId={projectId!} />
        <button
          onClick={() => setCreateStatus('todo')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '7px',
            padding: '9px 18px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none', borderRadius: '8px',
            color: '#fff', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', flexShrink: 0,
            boxShadow: '0 2px 8px rgba(99,102,241,0.35)',
            transition: 'opacity 0.15s, transform 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none'; }}
        >
          <FiPlus size={14} /> Nueva tarea
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px' }}>
          {COLUMNS.map(status => (
            <Column
              key={status}
              status={status}
              tasks={grouped[status]}
              onAddTask={(s) => setCreateStatus(s)}
              onEdit={(t) => setEditTask(t)}
              onDelete={(t) => setDeleteTask(t)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <Task task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>

      {/* Modals */}
      <CreateTaskModal
        isOpen={!!createStatus}
        onClose={() => setCreateStatus(null)}
        projectId={Number(projectId)}
        defaultStatus={createStatus ?? 'todo'}
      />

      {editTask && (
        <UpdateTaskModal
          isOpen={!!editTask}
          onClose={() => setEditTask(null)}
          task={editTask}
        />
      )}

      {deleteTask && (
        <DeleteTaskModal
          isOpen={!!deleteTask}
          onClose={() => setDeleteTask(null)}
          taskId={deleteTask.id}
          projectId={Number(projectId)}
        />
      )}
    </div>
  );
};

export default Board;
