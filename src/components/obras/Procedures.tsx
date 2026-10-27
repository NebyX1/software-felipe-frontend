import { useState } from "react";
import { useApi, useAction } from "../../domain/hooks";
import { useSession, has } from "../../domain/session";
import type { Doc, Reference } from "../../domain/types";
import { download } from "../../domain/api";
import { Panel, Field, Badge, Status } from "./UI";
export interface Procedure {
  id: number;
  work_id: number;
  work_name?: string;
  title: string;
  status: string;
  version: number;
  author_id: number;
  company_id: number | null;
  due_date: string | null;
  responsible_id: number | null;
  unit_id: number | null;
  data: {
    description: string;
    document_ids: number[];
    comments: {
      text: string;
      date: string;
      status: string;
      actor_id: number;
    }[];
  };
}
const reviewerRoles = [
  "super_admin",
  "admin",
  "direccion_general",
  "director_obra",
  "administrativo",
];
export default function Procedures({ workId }: { workId: number }) {
  const rows = useApi<{ procedures: Procedure[] }>(
    `/works/${workId}/procedures`,
  );
  const documents = useApi<{ documents: Doc[] }>(`/works/${workId}/documents`);
  const ref = useApi<Reference>("/reference");
  const run = useAction();
  const user = useSession((s) => s.user);
  const [creating, setCreating] = useState(false);
  const [unit, setUnit] = useState("");
  const canCreate = has([...reviewerRoles, "empresa", "tecnico", "inspector"]);
  const evidence = (
    <Field label="Adjuntos documentales">
      <select name="documents" multiple aria-label="Adjuntos documentales">
        {documents.data?.documents
          .filter((d) => !["eliminado", "sustituido"].includes(d.status))
          .map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} · v{d.version}
            </option>
          ))}
      </select>
      <small>
        Seleccioná los documentos previamente cargados en la intervención.
      </small>
    </Field>
  );
  return (
    <Panel
      title="Trámites documentales"
      actions={
        canCreate && (
          <button onClick={() => setCreating(!creating)}>Nuevo trámite</button>
        )
      }
    >
      <p className="hint">
        Presentación, revisión, observación, subsanación y decisión con pases
        entre unidades y responsables.
      </p>
      {creating && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            if (
              await run(`/works/${workId}/procedures`, {
                title: f.get("title"),
                description: f.get("description"),
                due_date: f.get("due_date"),
                document_ids: f.getAll("documents").map(Number),
              })
            )
              setCreating(false);
          }}
        >
          <div className="form-grid">
            <Field label="Asunto del trámite">
              <input name="title" required maxLength={250} />
            </Field>
            <Field label="Plazo solicitado">
              <input type="date" name="due_date" />
            </Field>
          </div>
          <Field label="Solicitud documental">
            <textarea name="description" required />
          </Field>
          {evidence}
          <button>Guardar borrador de trámite</button>
        </form>
      )}
      <Status
        loading={rows.isLoading}
        error={rows.error}
        empty={!!rows.data && !rows.data.procedures.length}
      />
      {rows.data?.procedures.map((p) => {
        const own =
          user?.id === p.author_id ||
          (user?.role === "empresa" && user.company_id === p.company_id);
        const review =
          has(reviewerRoles) &&
          (has(["admin", "super_admin", "direccion_general"]) ||
            !p.responsible_id ||
            user?.id === p.responsible_id);
        const choices: string[] = [];
        if (own && ["borrador", "subsanado"].includes(p.status))
          choices.push("ingresado");
        if (own && p.status === "observado") choices.push("subsanado");
        if (review && p.status === "ingresado") choices.push("en_revision");
        if (review && p.status === "en_revision")
          choices.push("observado", "aprobado", "rechazado");
        if (review && ["aprobado", "rechazado"].includes(p.status))
          choices.push("archivado");
        const derive =
          has(reviewerRoles) &&
          ["ingresado", "en_revision", "subsanado"].includes(p.status);
        if (derive) choices.push("derivar");
        return (
          <article key={p.id} className="record-card">
            <div className="section-heading">
              <h3>
                #{p.id} · {p.title}
              </h3>
              <Badge value={p.status} />
            </div>
            <p>{p.data.description}</p>
            <p className="hint">
              Unidad:{" "}
              {ref.data?.units.find((u) => u.id === p.unit_id)?.name ||
                "Sin asignar"}{" "}
              · Responsable:{" "}
              {ref.data?.users.find((u) => u.id === p.responsible_id)?.name ||
                "Sin asignar"}{" "}
              · Plazo: {p.due_date || "Sin plazo"}
            </p>
            <div className="actions">
              {p.data.document_ids.map((id) => (
                <button
                  key={id}
                  className="ghost small"
                  onClick={() => download(`/documents/${id}/download`)}
                >
                  Documento #{id}
                </button>
              ))}
            </div>
            {p.data.comments.map((c, i) => (
              <div className="comment" key={i}>
                <small>
                  {c.date.slice(0, 16).replace("T", " ")} ·{" "}
                  {c.status.replaceAll("_", " ")} · Usuario #{c.actor_id}
                </small>
                <p>{c.text}</p>
              </div>
            ))}
            {choices.length > 0 && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  await run(`/works/${workId}/procedures/${p.id}/transition`, {
                    version: p.version,
                    status: f.get("status"),
                    comment: f.get("comment"),
                    document_ids: f.getAll("documents").map(Number),
                    unit_id: Number(f.get("unit_id")) || undefined,
                    responsible_id:
                      Number(f.get("responsible_id")) || undefined,
                    due_date: f.get("due_date"),
                  });
                }}
              >
                <div className="form-grid">
                  <Field label="Siguiente actuación">
                    <select name="status">
                      {choices.map((s) => (
                        <option value={s} key={s}>
                          {(
                            {
                              ingresado: "Presentar solicitud",
                              en_revision: "Iniciar revisión",
                              subsanado: "Subsanar observación",
                              derivar: "Derivar a otra unidad",
                            } as Record<string, string>
                          )[s] || s.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Actuación del trámite">
                    <textarea name="comment" required />
                  </Field>
                </div>
                {derive && (
                  <details>
                    <summary>Destino del pase entre unidades</summary>
                    <div className="form-grid">
                      <Field label="Unidad de destino">
                        <select
                          name="unit_id"
                          value={unit}
                          onChange={(e) => setUnit(e.target.value)}
                        >
                          <option value="">Elegir unidad</option>
                          {ref.data?.units.map((u) => (
                            <option value={u.id} key={u.id}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Responsable de destino">
                        <select name="responsible_id">
                          <option value="">Elegir responsable</option>
                          {ref.data?.users
                            .filter(
                              (u) =>
                                u.unit_id === Number(unit) &&
                                reviewerRoles.includes(u.role),
                            )
                            .map((u) => (
                              <option value={u.id} key={u.id}>
                                {u.name}
                              </option>
                            ))}
                        </select>
                      </Field>
                      <Field label="Nuevo plazo">
                        <input
                          type="date"
                          name="due_date"
                          defaultValue={p.due_date || ""}
                        />
                      </Field>
                    </div>
                  </details>
                )}
                {evidence}
                <button>Registrar actuación del trámite</button>
              </form>
            )}
          </article>
        );
      })}
    </Panel>
  );
}
