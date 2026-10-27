import { useState } from "react";
import { download } from "../../domain/api";
import {
  DndContext,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { Actor, Doc, WorkRecord } from "../../domain/types";
import { useApi, useAction } from "../../domain/hooks";
import {
  useSession,
  has,
  editors,
  directors,
  generals,
} from "../../domain/session";
import { Panel, Field, Badge, Status } from "./UI";
import { Evidence, formIds } from "./Documents";
const transitions: Record<string, Record<string, string[]>> = {
  tarea: {
    pendiente: ["en_curso", "cancelada"],
    en_curso: ["bloqueada", "en_revision", "cancelada"],
    bloqueada: ["en_curso", "cancelada"],
    en_revision: ["en_curso", "finalizada"],
  },
  observacion: {
    observado: ["respuesta"],
    respuesta: ["en_revision", "cerrado", "observado"],
    en_revision: ["cerrado", "observado"],
  },
  mantenimiento: {
    pendiente: ["realizado"],
    realizado: ["revisado", "pendiente"],
  },
  licitacion: {
    preparacion: ["publicada", "cancelada"],
    publicada: ["evaluacion", "cancelada"],
    evaluacion: ["adjudicada", "cancelada"],
  },
  prorroga: { pendiente: ["aprobado", "rechazado"] },
  cambio: { pendiente: ["aprobado", "rechazado"] },
};
export default function Records({
  workId,
  actors,
  stage,
}: {
  workId: number;
  actors: Actor[];
  stage: string;
}) {
  const rows = useApi<{ records: WorkRecord[] }>(`/works/${workId}/records`);
  const docs = useApi<{ documents: Doc[] }>(`/works/${workId}/documents`);
  const [kind, setKind] = useState(
    stage === "posobra" ? "mantenimiento" : "tarea",
  );
  const [filter, setFilter] = useState("todos");
  const [creating, setCreating] = useState(false);
  const [edit, setEdit] = useState<WorkRecord | null>(null);
  const run = useAction();
  const user = useSession((s) => s.user);
  const available = [
    "tarea",
    "visita",
    "observacion",
    "incidencia",
    "licitacion",
    ...(has(directors) ? ["prorroga", "cambio"] : []),
    ...(stage === "posobra" ? ["recepcion", "mantenimiento"] : []),
  ];
  const visible =
    rows.data?.records.filter((r) => filter === "todos" || r.kind === filter) ||
    [];
  return (
    <>
      <Panel
        title="Informes, pendientes y posobra"
        actions={
          <div className="actions">
            <select
              aria-label="Filtrar registros"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="todos">Todos los registros</option>
              {[
                "tarea",
                "visita",
                "observacion",
                "incidencia",
                "licitacion",
                "prorroga",
                "cambio",
                "recepcion",
                "mantenimiento",
              ].map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
            {has([...editors, "inspector"]) && (
              <button onClick={() => setCreating(!creating)}>
                Nuevo registro
              </button>
            )}
          </div>
        }
      >
        <Status
          loading={rows.isLoading}
          error={rows.error}
          empty={!visible.length}
        />
        {filter === "tarea" ? (
          <DndContext
            onDragEnd={async (e: DragEndEvent) => {
              if (!e.over) return;
              const row = visible.find((r) => r.id === e.active.id);
              if (!row) return;
              const target = String(e.over.id);
              if (!transitions.tarea[row.status]?.includes(target)) return;
              await run(`/works/${workId}/records/${row.id}/transition`, {
                version: row.version,
                status: target,
                comment: `Tarea movida de ${row.status} a ${target} en Kanban`,
              });
            }}
          >
            <div className="kanban">
              {[
                "pendiente",
                "en_curso",
                "bloqueada",
                "en_revision",
                "finalizada",
              ].map((s) => (
                <KanbanColumn key={s} status={s}>
                  {visible
                    .filter((r) => r.status === s)
                    .map((r) => (
                      <DraggableCard
                        key={r.id}
                        row={r}
                        enabled={
                          has(directors) || r.responsible_id === user?.id
                        }
                        onEdit={() => setEdit(r)}
                      />
                    ))}
                </KanbanColumn>
              ))}
            </div>
          </DndContext>
        ) : (
          <div className="record-list">
            {visible.map((r) => (
              <article className="record-card" key={r.id}>
                <div className="section-heading">
                  <span>
                    {r.kind} · {r.date}
                  </span>
                  <Badge value={r.status} />
                </div>
                <h3>{r.title}</h3>
                <p>{r.data.description}</p>
                <small>
                  Responsable:{" "}
                  {actors.find((a) => a.user_id === r.responsible_id)?.name ||
                    "Sin asignar"}{" "}
                  · Vence {r.due_date || "Sin plazo"} · Autor #{r.author_id}
                </small>
                {r.kind === "recepcion" && (
                  <small>
                    Recepción {r.data.type} · Definitiva prevista:{" "}
                    {r.data.definitive_date || "—"}
                  </small>
                )}
                {r.kind === "mantenimiento" && (
                  <small>Periodicidad: {r.data.frequency}</small>
                )}
                {r.data.document_ids?.map((id) => (
                  <button
                    className="ghost small"
                    key={id}
                    onClick={() => download(`/documents/${id}/download`)}
                  >
                    Adjunto #{id}
                  </button>
                ))}
                {r.data.comments?.map((c, i) => (
                  <div className="comment" key={i}>
                    <small>
                      {c.date} · Usuario #{c.actor_id} · {c.status}
                    </small>
                    <p>{c.text}</p>
                    {c.document_ids?.map((id) => (
                      <button
                        className="ghost small"
                        key={id}
                        onClick={() => download(`/documents/${id}/download`)}
                      >
                        Evidencia #{id}
                      </button>
                    ))}
                  </div>
                ))}
                {Object.keys(transitions[r.kind] || {}).includes(r.status) && (
                  <TransitionForm
                    row={r}
                    workId={workId}
                    docs={docs.data?.documents || []}
                  />
                )}
                <div className="actions">
                  {has([...editors, "inspector"]) && (
                    <button className="ghost small" onClick={() => setEdit(r)}>
                      Editar planificación / informe
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>
      {creating && (
        <Panel title="Nuevo registro">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              const payload = {
                kind,
                title: form.get("title"),
                date: form.get("date"),
                due_date: form.get("due_date"),
                responsible_id: form.get("responsible_id")
                  ? Number(form.get("responsible_id"))
                  : null,
                data: {
                  description: form.get("description"),
                  priority: form.get("priority"),
                  type: form.get("type"),
                  frequency: form.get("frequency"),
                  new_end_date: form.get("new_end_date"),
                  definitive_date: form.get("definitive_date"),
                  contract_id: form.get("contract_id")
                    ? Number(form.get("contract_id"))
                    : undefined,
                  schedule_id: form.get("schedule_id")
                    ? Number(form.get("schedule_id"))
                    : undefined,
                  document_ids: formIds(form),
                },
              };
              if (await run(`/works/${workId}/records`, payload))
                setCreating(false);
            }}
          >
            <div className="form-grid">
              <Field label="Tipo de registro">
                <select value={kind} onChange={(e) => setKind(e.target.value)}>
                  {available.map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </Field>
              <Field label="Título">
                <input name="title" required />
              </Field>
              <Field label="Responsable">
                <select name="responsible_id">
                  <option value="">Sin asignar</option>
                  {actors
                    .filter((a) => a.user_id)
                    .map((a) => (
                      <option key={a.id} value={a.user_id || 0}>
                        {a.name}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Fecha del informe / recepción">
                <input
                  type="date"
                  name="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  required
                />
              </Field>
              <Field label="Plazo / próximo hito">
                <input
                  type="date"
                  name="due_date"
                  required={kind === "mantenimiento"}
                />
              </Field>
              {kind === "tarea" && (
                <Field label="Prioridad">
                  <select name="priority">
                    {["normal", "alta", "baja"].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </Field>
              )}
              {kind === "mantenimiento" && (
                <Field label="Frecuencia">
                  <select name="frequency">
                    {[
                      "unica",
                      "mensual",
                      "trimestral",
                      "anual",
                      "estacional",
                    ].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </Field>
              )}
              {kind === "recepcion" && (
                <>
                  <Field label="Recepción">
                    <select name="type">
                      <option value="provisoria">Provisoria</option>
                      <option value="definitiva">Definitiva</option>
                    </select>
                  </Field>
                  <Field label="Fecha prevista de recepción definitiva">
                    <input type="date" name="definitive_date" />
                  </Field>
                </>
              )}
              {kind === "incidencia" && (
                <Field label="Incidencia">
                  <select name="type">
                    {["lluvia", "paro", "feriado", "otro"].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </Field>
              )}
              {kind === "prorroga" && (
                <Field label="Nueva finalización solicitada">
                  <input name="new_end_date" type="date" required />
                </Field>
              )}
              {kind === "cambio" && (
                <>
                  <Field label="ID de rubrado contractual nuevo (borrador)">
                    <input name="contract_id" type="number" required />
                  </Field>
                  <Field label="ID de cronograma revisado (si corresponde)">
                    <input name="schedule_id" type="number" />
                  </Field>
                </>
              )}
            </div>
            <Field label="Informe / alcance / justificación">
              <textarea name="description" rows={4} required />
            </Field>
            <Evidence documents={docs.data?.documents || []} />
            <div className="actions">
              <button>Registrar</button>
              <button
                type="button"
                className="ghost"
                onClick={() => setCreating(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        </Panel>
      )}
      {edit && (
        <Panel title={`Editar ${edit.title}`}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              if (
                await run(
                  `/works/${workId}/records/${edit.id}`,
                  {
                    version: edit.version,
                    title: f.get("title"),
                    due_date: f.get("due_date"),
                    responsible_id: Number(f.get("responsible_id")) || null,
                    data: {
                      ...edit.data,
                      description: f.get("description"),
                      frequency: f.get("frequency") || edit.data.frequency,
                    },
                  },
                  "patch",
                )
              )
                setEdit(null);
            }}
          >
            <div className="form-grid">
              <Field label="Título">
                <input name="title" defaultValue={edit.title} required />
              </Field>
              <Field label="Plazo / hito">
                <input
                  name="due_date"
                  type="date"
                  defaultValue={edit.due_date || ""}
                />
              </Field>
              <Field label="Responsable">
                <select
                  name="responsible_id"
                  defaultValue={edit.responsible_id || ""}
                >
                  <option value="">Sin asignar</option>
                  {actors
                    .filter((a) => a.user_id)
                    .map((a) => (
                      <option value={a.user_id || 0} key={a.id}>
                        {a.name}
                      </option>
                    ))}
                </select>
              </Field>
              {edit.kind === "mantenimiento" && (
                <Field label="Frecuencia">
                  <select name="frequency" defaultValue={edit.data.frequency}>
                    {[
                      "unica",
                      "mensual",
                      "trimestral",
                      "anual",
                      "estacional",
                    ].map((k) => (
                      <option key={k}>{k}</option>
                    ))}
                  </select>
                </Field>
              )}
            </div>
            <Field label="Informe">
              <textarea
                name="description"
                defaultValue={edit.data.description}
                required
              />
            </Field>
            <div className="actions">
              <button>Guardar revisión</button>
              <button
                type="button"
                className="ghost"
                onClick={() => setEdit(null)}
              >
                Cancelar
              </button>
            </div>
          </form>
        </Panel>
      )}
    </>
  );
}
function TransitionForm({
  row: r,
  workId,
  docs,
}: {
  row: WorkRecord;
  workId: number;
  docs: Doc[];
}) {
  const run = useAction();
  const user = useSession((s) => s.user);
  const targets = (transitions[r.kind]?.[r.status] || []).filter((t) =>
    r.kind === "observacion"
      ? user?.role === "empresa"
        ? t === "respuesta"
        : has([...directors, "inspector"]) && t !== "respuesta"
      : r.kind === "mantenimiento"
        ? t === "revisado"
          ? has(generals)
          : has([...directors, "tecnico", "inspector"])
        : ["cambio", "prorroga"].includes(r.kind)
          ? has(generals)
          : r.kind === "tarea"
            ? has(directors) || r.responsible_id === user?.id
            : has(directors),
  );
  if (!targets.length) return null;
  return (
    <details style={{ marginTop: 15 }}>
      <summary>Registrar respuesta / cambiar estado</summary>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          if (
            await run(`/works/${workId}/records/${r.id}/transition`, {
              version: r.version,
              status: form.get("status"),
              comment: form.get("comment"),
              document_ids: formIds(form),
            })
          )
            e.currentTarget?.reset();
        }}
      >
        <div className="form-grid two">
          <Field label="Siguiente estado">
            <select name="status">
              {targets.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Comentario / descargo / resolución">
            <textarea name="comment" required />
          </Field>
        </div>
        <Evidence documents={docs} />
        <button>Registrar actuación</button>
      </form>
    </details>
  );
}
function KanbanColumn({
  status,
  children,
}: {
  status: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className="kanban-column"
      style={{ borderColor: isOver ? "var(--brand)" : undefined }}
    >
      <h3>{status.replaceAll("_", " ")}</h3>
      {children}
    </div>
  );
}
function DraggableCard({
  row,
  enabled,
  onEdit,
}: {
  row: WorkRecord;
  enabled: boolean;
  onEdit: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: row.id,
    disabled: !enabled,
  });
  return (
    <div
      ref={setNodeRef}
      className="record-card"
      style={{
        transform: transform
          ? `translate(${transform.x}px,${transform.y}px)`
          : undefined,
      }}
    >
      <div {...listeners} {...attributes} tabIndex={enabled ? 0 : undefined}>
        <small>
          {row.data.priority} · {row.due_date}
        </small>
        <h3>{row.title}</h3>
      </div>
      <button className="ghost small" onClick={onEdit}>
        Detalle / editar
      </button>
    </div>
  );
}
