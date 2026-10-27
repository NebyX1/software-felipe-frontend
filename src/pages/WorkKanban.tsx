import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  FiBarChart2,
  FiCalendar,
  FiEdit2,
  FiFileText,
  FiImage,
  FiPlus,
  FiTrash2,
  FiUpload,
} from 'react-icons/fi';
import api from '../api/axios';
import { useUnits } from '../api/hooks/useUnits';
import {
  useCreateWorkTask,
  useDeleteWorkTask,
  useUpdateWorkTask,
  useUploadWorkDocument,
  useWorkDocuments,
  useUploadWorkTaskDocument,
  useWorkTaskDocuments,
  useWorkTasks,
  useWorks,
} from '../api/hooks/useWorks';
import useAuth from '../store/useAuth';
import type {
  CreateWorkTaskInput,
  WorkDocumentKind,
  WorkTask,
  WorkTaskPriority,
  WorkTaskStatus,
} from '../types';

const STATUS_ORDER: WorkTaskStatus[] = ['todo', 'in_progress', 'review', 'blocked', 'done'];

const STATUS_LABELS: Record<WorkTaskStatus, string> = {
  todo: 'Por hacer',
  in_progress: 'En curso',
  review: 'Revision tecnica',
  blocked: 'Bloqueada',
  done: 'Finalizada',
};

const STATUS_COLORS: Record<WorkTaskStatus, string> = {
  todo: '#64748b',
  in_progress: '#3b82f6',
  review: '#8b5cf6',
  blocked: '#ef4444',
  done: '#22c55e',
};

const PRIORITY_LABELS: Record<WorkTaskPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Critica',
};

const PRIORITY_COLORS: Record<WorkTaskPriority, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

const DOC_KIND_LABELS: Record<WorkDocumentKind, string> = {
  task_attachment: 'Adjunto de tarea',
  start: 'Inicio de obra',
  completion: 'Finalizacion',
  other: 'Otro',
};

interface SortableTaskCardProps {
  task: WorkTask;
  onEdit: (task: WorkTask) => void;
  onDelete: (task: WorkTask) => void;
}

const SortableTaskCard = ({
  task,
  onEdit,
  onDelete,
}: SortableTaskCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.9 : 1 }}
      {...attributes}
      {...listeners}
    >
      <article
        style={{
          ...taskCardStyle,
          boxShadow: isDragging
            ? '0 10px 24px rgba(0,0,0,0.18)'
            : '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
      <h4 style={{ margin: 0, color: 'var(--text)', fontSize: '14px', lineHeight: 1.35 }}>
        {task.title}
      </h4>
      <div style={{ marginTop: '7px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            fontSize: '10px',
            color: PRIORITY_COLORS[task.priority],
            background: `${PRIORITY_COLORS[task.priority]}18`,
            border: `1px solid ${PRIORITY_COLORS[task.priority]}40`,
            borderRadius: '999px',
            padding: '2px 7px',
          }}
        >
          {PRIORITY_LABELS[task.priority]}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {task.documents_count} docs
        </span>
      </div>
      {task.responsible && (
        <div style={{ marginTop: '6px', color: 'var(--text-muted)', fontSize: '11px' }}>
          Responsable: {task.responsible}
        </div>
      )}
      {task.due_date && (
        <div
          style={{
            marginTop: '5px',
            color: 'var(--text-muted)',
            fontSize: '11px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <FiCalendar size={11} /> {new Date(task.due_date).toLocaleDateString('es-ES')}
        </div>
      )}
      <div style={{ marginTop: '7px', height: '6px', borderRadius: '999px', background: 'var(--muted-bg)', overflow: 'hidden' }}>
        <div style={{ width: `${task.progress}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #22c55e)' }} />
      </div>
      <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
        <button style={iconBtnStyle} onClick={() => onEdit(task)}><FiEdit2 size={13} /></button>
        <button style={{ ...iconBtnStyle, color: '#ef4444' }} onClick={() => onDelete(task)}><FiTrash2 size={13} /></button>
      </div>
      </article>
    </div>
  );
};

interface WorkColumnProps {
  status: WorkTaskStatus;
  tasks: WorkTask[];
  onAddTask: (status: WorkTaskStatus) => void;
  onEdit: (task: WorkTask) => void;
  onDelete: (task: WorkTask) => void;
}

const WorkColumn = ({ status, tasks, onAddTask, onEdit, onDelete }: WorkColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      style={{
        border: `1px solid ${isOver ? 'rgba(99,102,241,0.5)' : 'var(--border)'}`,
        borderRadius: '12px',
        background: 'var(--column-bg)',
        minHeight: '280px',
        minWidth: '260px',
        flex: 1,
        transition: 'border-color 0.15s',
      }}
    >
      <div style={{ padding: '12px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: STATUS_COLORS[status] }} />
          <strong style={{ color: 'var(--text)', fontSize: '12px' }}>{STATUS_LABELS[status]}</strong>
          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>({tasks.length})</span>
        </div>
        <button style={iconBtnStyle} onClick={() => onAddTask(status)}><FiPlus size={13} /></button>
      </div>

      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          style={{
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            minHeight: '170px',
            background: isOver && tasks.length === 0 ? 'rgba(99,102,241,0.06)' : undefined,
            borderRadius: '10px',
            transition: 'background 0.15s',
          }}
        >
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
          ))}

          {tasks.length === 0 && (
            <div style={{ border: '1px dashed var(--border)', borderRadius: '9px', color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '16px 10px' }}>
              Sin tareas en esta columna.
            </div>
          )}
        </div>
      </SortableContext>
    </section>
  );
};

const WorkKanban = () => {
  const user = useAuth((s) => s.user);
  const { workId, unitId } = useParams<{ workId: string; unitId?: string }>();
  const parsedWorkId = Number(workId);
  const selectedUnitId = unitId ? Number(unitId) : user?.unit_id ?? undefined;
  const isAdminView = user?.role === 'admin' || user?.role === 'super_admin';

  const { data: units = [] } = useUnits();
  const unit = units.find((u) => u.id === selectedUnitId);

  const { data: works = [] } = useWorks(selectedUnitId);
  const work = works.find((w) => w.id === parsedWorkId);

  const { data: tasks = [], isLoading, isError } = useWorkTasks(parsedWorkId);
  const createTask = useCreateWorkTask();
  const updateTask = useUpdateWorkTask();
  const deleteTask = useDeleteWorkTask();

  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<WorkTask | null>(null);
  const [activeTask, setActiveTask] = useState<WorkTask | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );



  const grouped = useMemo(() => {
    return STATUS_ORDER.reduce<Record<WorkTaskStatus, WorkTask[]>>((acc, status) => {
      acc[status] = tasks.filter((t) => t.status === status);
      return acc;
    }, { todo: [], in_progress: [], review: [], blocked: [], done: [] });
  }, [tasks]);

  const openCreate = (status: WorkTaskStatus) => {
    setEditingTask({
      id: 0,
      work_id: parsedWorkId,
      title: '',
      description: '',
      status,
      priority: 'medium',
      responsible: '',
      due_date: null,
      progress: status === 'done' ? 100 : 0,
      documents_count: 0,
      created_at: '',
      updated_at: '',
    });
    setShowModal(true);
  };

  const openEdit = (task: WorkTask) => {
    setEditingTask(task);
    setShowModal(true);
  };

  const allTasks = useMemo(() => (
    STATUS_ORDER.flatMap((status) => grouped[status])
  ), [grouped]);

  const onDragStart = (event: DragStartEvent) => {
    setActiveTask(allTasks.find((task) => task.id === event.active.id) ?? null);
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const draggedTask = allTasks.find((task) => task.id === active.id);
    if (!draggedTask) return;

    const overTask = allTasks.find((task) => task.id === over.id);
    let targetStatus: WorkTaskStatus | undefined;

    if (overTask) {
      targetStatus = overTask.status;
    } else {
      const maybeStatus = String(over.id) as WorkTaskStatus;
      if (STATUS_ORDER.includes(maybeStatus)) {
        targetStatus = maybeStatus;
      }
    }

    if (targetStatus && targetStatus !== draggedTask.status) {
      updateTask.mutate({
        workId: parsedWorkId,
        taskId: draggedTask.id,
        payload: { status: targetStatus },
      });
    }
  };

  return (
    <div style={{ maxWidth: 1550, margin: '0 auto', padding: '30px 22px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text)', fontSize: 'clamp(26px, 3.8vw, 36px)', lineHeight: 1.05 }}>
            {unit?.emoji || '🏗️'} Kanban tecnico de obra
          </h1>
          <p style={{ margin: '8px 0 0', color: 'var(--text-mid)', fontSize: '14px' }}>
            {work?.title || 'Obra'} · {unit?.name || user?.unit_name || 'Area'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '9px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Link to={isAdminView ? `/admin/areas/${selectedUnitId}/works` : '/works'} style={ghostBtnStyle}>Volver al dashboard</Link>
          <Link to={isAdminView ? `/admin/areas/${selectedUnitId}/works/${parsedWorkId}/kpis` : `/works/${parsedWorkId}/kpis`} style={ghostBtnStyle}>
            <FiBarChart2 size={14} /> KPIs obra
          </Link>
        </div>
      </div>

      <GeneralWorkDocumentsBlock workId={work?.id} workTitle={work?.title} />

      {isLoading && <div style={{ color: 'var(--text-muted)' }}>Cargando tareas...</div>}
      {isError && <div style={{ color: '#ef4444' }}>No se pudieron cargar tareas.</div>}

      {!isLoading && !isError && (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '6px' }}>
            {STATUS_ORDER.map((status) => (
              <WorkColumn
                key={status}
                status={status}
                tasks={grouped[status]}
                onAddTask={openCreate}
                onEdit={openEdit}
                onDelete={(task) => deleteTask.mutate({ workId: parsedWorkId, taskId: task.id })}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? <article style={taskCardStyle}><h4 style={{ margin: 0, color: 'var(--text)', fontSize: '14px' }}>{activeTask.title}</h4></article> : null}
          </DragOverlay>
        </DndContext>
      )}

      {showModal && editingTask && (
        <WorkTaskModal
          key={editingTask.id}
          workId={parsedWorkId}
          task={editingTask.id ? editingTask : null}
          initial={editingTask}
          onClose={() => {
            setShowModal(false);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
};

const GeneralWorkDocumentsBlock = ({
  workId,
  workTitle,
}: {
  workId?: number;
  workTitle?: string;
}) => {
  const { data: docs = [] } = useWorkDocuments(workId);
  const upload = useUploadWorkDocument();
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [kind, setKind] = useState<WorkDocumentKind>('other');
  const [previewDocName, setPreviewDocName] = useState<string | null>(null);
  const [previewDocMime, setPreviewDocMime] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const uploadWorkFile = (file: File | null, uploadType: 'document' | 'image') => {
    if (!workId || !file) return;
    upload.mutate(
      { workId, file, kind, uploadType },
      {
        onSuccess: () => {
          if (uploadType === 'document') {
            setDocumentFile(null);
          } else {
            setImageFile(null);
          }
        },
      }
    );
  };

  const openPreview = async (doc: { download_url: string; original_name: string; mime_type: string }) => {
    const { data } = await api.get(doc.download_url, { responseType: 'blob' });
    const objectUrl = URL.createObjectURL(data);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(objectUrl);
    setPreviewDocName(doc.original_name);
    setPreviewDocMime(doc.mime_type);
  };

  return (
    <section style={docsPanelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: 0, color: 'var(--text)', fontSize: '16px' }}>
            Documentos generales de obra
          </h3>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '12px' }}>
            {workTitle || 'Obra'} · Este bloque ahora vive arriba del tablero Kanban.
          </p>
        </div>
      </div>

      <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <label style={uploadFieldTitleStyle}><FiFileText size={13} /> Campo de documentos</label>
          <input type='file' accept='.pdf,.doc,.docx,.xls,.xlsx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain' onChange={(e) => setDocumentFile(e.target.files?.[0] ?? null)} style={fileInputStyle} />
          <button onClick={() => uploadWorkFile(documentFile, 'document')} disabled={!documentFile || upload.isPending || !workId} style={{ ...ghostBtnStyle, justifyContent: 'center', marginTop: '8px', width: '100%' }}>
            <FiUpload size={13} /> Subir documento
          </button>
        </div>

        <div>
          <label style={uploadFieldTitleStyle}><FiImage size={13} /> Campo de imagen</label>
          <input type='file' accept='image/webp,image/jpeg,image/png,image/gif' onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} style={fileInputStyle} />
          <button onClick={() => uploadWorkFile(imageFile, 'image')} disabled={!imageFile || upload.isPending || !workId} style={{ ...primaryBtnStyle, justifyContent: 'center', marginTop: '8px', width: '100%' }}>
            <FiUpload size={13} /> Subir imagen
          </button>
        </div>
      </div>

      <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: 'minmax(220px, 300px) minmax(180px, 220px) 1fr', gap: '8px', alignItems: 'center' }}>
        <select value={kind} onChange={(e) => setKind(e.target.value as WorkDocumentKind)} style={inputStyle}>
          {Object.entries(DOC_KIND_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
          Documentos e imagenes hasta 2MB por archivo
        </div>
      </div>

      <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '8px' }}>
        {docs.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
            Sin documentos generales cargados.
          </div>
        )}
        {docs.map((doc) => (
          <button key={doc.id} onClick={() => openPreview(doc)} style={docRowStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {doc.mime_type.includes('image') ? <FiImage size={13} /> : <FiFileText size={13} />}
              <span style={{ fontSize: '12px', fontWeight: 600 }}>{doc.original_name}</span>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{(doc.size_bytes / 1024).toFixed(1)} KB</span>
          </button>
        ))}
      </div>

      {previewUrl && (
        <div style={{ marginTop: '10px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
          <div style={{ color: 'var(--text-mid)', fontSize: '12px', marginBottom: '6px' }}>
            Vista previa - {previewDocName}
          </div>
          {previewDocMime?.includes('image') ? (
            <img src={previewUrl} alt={previewDocName || 'preview'} style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid var(--border)' }} />
          ) : (
            <iframe src={previewUrl} title='work-doc-preview' style={{ width: '100%', height: '240px', border: '1px solid var(--border)', borderRadius: '8px' }} />
          )}
        </div>
      )}
    </section>
  );
};

const WorkTaskModal = ({
  workId,
  task,
  initial,
  onClose,
}: {
  workId: number;
  task: WorkTask | null;
  initial: WorkTask;
  onClose: () => void;
}) => {
  const createTask = useCreateWorkTask();
  const updateTask = useUpdateWorkTask();
  const uploadTaskDoc = useUploadWorkTaskDocument();
  const { data: existingDocs = [] } = useWorkTaskDocuments(workId, task?.id);

  const [payload, setPayload] = useState<CreateWorkTaskInput>({
    title: initial.title || '',
    description: initial.description || '',
    status: initial.status,
    priority: initial.priority,
    responsible: initial.responsible || '',
    due_date: initial.due_date || '',
    progress: initial.progress,
  });
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [docKind, setDocKind] = useState<WorkDocumentKind>('task_attachment');

  const submit = async () => {
    const cleanPayload: CreateWorkTaskInput = {
      ...payload,
      title: (payload.title || '').trim(),
      description: (payload.description || '').trim() || undefined,
      responsible: (payload.responsible || '').trim() || undefined,
      due_date: payload.due_date || undefined,
    };

    if (!cleanPayload.title) return;

    const onUpload = async (targetTaskId: number) => {
      for (const file of documentFiles) {
        await uploadTaskDoc.mutateAsync({
          workId,
          taskId: targetTaskId,
          file,
          kind: docKind,
          uploadType: 'document',
        });
      }

      for (const file of imageFiles) {
        await uploadTaskDoc.mutateAsync({
          workId,
          taskId: targetTaskId,
          file,
          kind: docKind,
          uploadType: 'image',
        });
      }
    };

    if (task) {
      updateTask.mutate(
        { workId, taskId: task.id, payload: cleanPayload },
        {
          onSuccess: async () => {
            await onUpload(task.id);
            onClose();
          },
        }
      );
      return;
    }

    createTask.mutate(
      { workId, payload: cleanPayload },
      {
        onSuccess: async (created) => {
          await onUpload(created.id);
          onClose();
        },
      }
    );
  };

  return (
    <div style={modalOverlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modalStyle}>
        <h3 style={{ marginTop: 0, color: 'var(--text)' }}>{task ? 'Editar tarea de obra' : 'Nueva tarea de obra'}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <input style={inputStyle} value={payload.title || ''} onChange={(e) => setPayload((p) => ({ ...p, title: e.target.value }))} placeholder='Titulo de tarea' />
          <input style={inputStyle} value={payload.responsible || ''} onChange={(e) => setPayload((p) => ({ ...p, responsible: e.target.value }))} placeholder='Responsable' />
          <select style={inputStyle} value={payload.status || 'todo'} onChange={(e) => setPayload((p) => ({ ...p, status: e.target.value as WorkTaskStatus }))}>
            {STATUS_ORDER.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
          </select>
          <select style={inputStyle} value={payload.priority || 'medium'} onChange={(e) => setPayload((p) => ({ ...p, priority: e.target.value as WorkTaskPriority }))}>
            {Object.keys(PRIORITY_LABELS).map((priority) => <option key={priority} value={priority}>{PRIORITY_LABELS[priority as WorkTaskPriority]}</option>)}
          </select>
          <input type='date' style={inputStyle} value={payload.due_date || ''} onChange={(e) => setPayload((p) => ({ ...p, due_date: e.target.value }))} />
          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Avance (%)
            </label>
            <input type='number' min={0} max={100} style={inputStyle} value={payload.progress || 0} onChange={(e) => setPayload((p) => ({ ...p, progress: Number(e.target.value) }))} placeholder='Avance %' />
          </div>
        </div>

        <textarea style={{ ...inputStyle, marginTop: '10px', resize: 'vertical' }} rows={3} value={payload.description || ''} onChange={(e) => setPayload((p) => ({ ...p, description: e.target.value }))} placeholder='Descripcion tecnica' />

        <div style={{ marginTop: '12px', border: '1px dashed var(--border)', borderRadius: '10px', padding: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-mid)', fontSize: '12px', marginBottom: '8px' }}>
            <FiUpload size={13} /> Adjuntos de tarea (maximo 2MB por archivo)
          </div>
          <select style={{ ...inputStyle, marginBottom: '8px' }} value={docKind} onChange={(e) => setDocKind(e.target.value as WorkDocumentKind)}>
            <option value='task_attachment'>Adjunto de tarea</option>
            <option value='start'>Inicio de obra</option>
            <option value='completion'>Finalizacion</option>
            <option value='other'>Otro</option>
          </select>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={uploadFieldTitleStyle}><FiFileText size={13} /> Campo de documentos</label>
              <input type='file' multiple accept='.pdf,.doc,.docx,.xls,.xlsx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain' onChange={(e) => setDocumentFiles(Array.from(e.target.files || []))} style={fileInputStyle} />
              {documentFiles.length > 0 && (
                <div style={{ marginTop: '8px', color: 'var(--text-muted)', fontSize: '11px' }}>
                  {documentFiles.length} documento(s) listo(s).
                </div>
              )}
            </div>
            <div>
              <label style={uploadFieldTitleStyle}><FiImage size={13} /> Campo de imagen</label>
              <input type='file' multiple accept='image/webp,image/jpeg,image/png,image/gif' onChange={(e) => setImageFiles(Array.from(e.target.files || []))} style={fileInputStyle} />
              {imageFiles.length > 0 && (
                <div style={{ marginTop: '8px', color: 'var(--text-muted)', fontSize: '11px' }}>
                  {imageFiles.length} imagen(es) lista(s).
                </div>
              )}
            </div>
          </div>

          {task && existingDocs.length > 0 && (
            <div style={{ marginTop: '10px', maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {existingDocs.map((doc) => (
                <a key={doc.id} href={doc.download_url} target='_blank' rel='noreferrer' style={{ color: 'var(--text-mid)', fontSize: '12px' }}>
                  {doc.original_name}
                </a>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button style={ghostBtnStyle} onClick={onClose}>Cancelar</button>
          <button style={primaryBtnStyle} onClick={submit}>Guardar tarea</button>
        </div>
      </div>
    </div>
  );
};

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1200,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '18px',
};

const modalStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '700px',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '14px',
  padding: '16px',
  maxHeight: '90vh',
  overflowY: 'auto',
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

const docsPanelStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: '12px',
  background: 'var(--surface)',
  padding: '12px',
  marginBottom: '14px',
};

const primaryBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '7px',
  border: 'none',
  borderRadius: '9px',
  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  color: '#fff',
  padding: '9px 14px',
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
  padding: '9px 14px',
  cursor: 'pointer',
  fontSize: '13px',
  textDecoration: 'none',
};

const iconBtnStyle: React.CSSProperties = {
  width: '26px',
  height: '26px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '7px',
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--text-muted)',
  cursor: 'pointer',
};

const docRowStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: '8px',
  background: 'var(--muted-bg)',
  color: 'var(--text)',
  padding: '8px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  cursor: 'pointer',
  textAlign: 'left',
};

const uploadFieldTitleStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  color: 'var(--text-mid)',
  fontSize: '12px',
  marginBottom: '8px',
};

const fileInputStyle: React.CSSProperties = {
  width: '100%',
  color: 'var(--text-muted)',
  fontSize: '12px',
  border: '1px dashed var(--border)',
  borderRadius: '10px',
  background: 'var(--muted-bg)',
  padding: '10px',
  cursor: 'pointer',
  boxSizing: 'border-box',
};

const taskCardStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: '10px',
  background: 'var(--surface)',
  padding: '10px',
  cursor: 'pointer',
};

export default WorkKanban;
