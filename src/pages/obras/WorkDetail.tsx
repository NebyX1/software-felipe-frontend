import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import type { Actor, Work, Metric, Reference } from "../../domain/types";
import { useApi, useAction } from "../../domain/hooks";
import { has, directors, editors } from "../../domain/session";
import { download } from "../../domain/api";
import {
  Badge,
  Panel,
  Field,
  Status,
  Confirm,
  Progress,
  currency,
} from "../../components/obras/UI";
import { DocImage } from "../../components/obras/Documents";
import Documents from "../../components/obras/Documents";
import WorkForm from "../../components/obras/WorkForm";
import Contracts from "../../components/obras/Contracts";
import Schedules from "../../components/obras/Schedules";
import Records from "../../components/obras/Records";
import Certificates from "../../components/obras/Certificates";
import Assistant from "../../components/obras/Assistant";
import Procedures from "../../components/obras/Procedures";
const tabs = [
  ["ficha", "Ficha"],
  ["actores", "Equipo y actores"],
  ["documentos", "Documentos"],
  ["rubrado", "Rubrado y contrato"],
  ["cronograma", "Cronograma"],
  ["registros", "Informes y pendientes"],
  ["certificados", "Certificación y pago"],
  ["tramites", "Trámites"],
  ["asistente", "Asistente"],
  ["historial", "Historial"],
];
export default function WorkDetail() {
  const { id } = useParams();
  const workId = Number(id);
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "ficha";
  const detail = useApi<{ work: Work; metrics: Metric; actors: Actor[] }>(
    `/works/${workId}`,
  );
  const [editing, setEditing] = useState(false);
  const run = useAction();
  if (!detail.data)
    return <Status loading={detail.isLoading} error={detail.error} />;
  const { work: w, actors, metrics: m } = detail.data;
  return (
    <>
      <div className="breadcrumb">
        <Link to="/obras">Intervenciones</Link> / {w.name}
      </div>
      <div className="detail-head">
        {w.cover_id && (
          <DocImage
            id={w.cover_id}
            alt={`Portada ${w.name}`}
            className="cover"
          />
        )}
        <div>
          <div className="actions">
            <Badge value={w.stage} />
            <Badge value={w.status} />
            <small>{w.code}</small>
          </div>
          <h1>{w.name}</h1>
          <small>
            {w.locality} · {w.location || "Ubicación pendiente"}
          </small>
        </div>
      </div>
      <div
        className="tabs"
        role="tablist"
        aria-label="Secciones de intervención"
      >
        {tabs.map(([key, title]) => (
          <button
            role="tab"
            aria-selected={tab === key}
            key={key}
            className={tab === key ? "active" : ""}
            onClick={() => setParams({ tab: key })}
          >
            {title}
          </button>
        ))}
      </div>
      {tab === "tramites" && <Procedures workId={workId} />}
      {tab === "ficha" && (
        <>
          <div className="metrics-grid">
            <div className="metric">
              <small>Avance físico ponderado</small>
              <strong>{m.physical_percent}%</strong>
              <Progress value={m.physical_percent} />
            </div>
            <div className="metric">
              <small>Previsto por tiempo transcurrido</small>
              <strong>{m.planned_percent}%</strong>
              <span>Comparación con fechas de la ficha</span>
            </div>
            <div className="metric">
              <small>Certificaciones aprobadas</small>
              <strong>{currency(m.certified)}</strong>
            </div>
            <div className="metric">
              <small>Pagos ficticios registrados</small>
              <strong>{currency(m.paid)}</strong>
            </div>
          </div>
          <p className="hint">{m.formula}</p>
          <Panel
            title="Ficha de intervención"
            actions={
              has(editors) && (
                <button className="ghost" onClick={() => setEditing(!editing)}>
                  Editar ficha
                </button>
              )
            }
          >
            <p style={{ marginBottom: 25 }}>{w.description}</p>
            <dl className="data-grid">
              {[
                ["Localidad", w.locality],
                ["Ubicación", w.location],
                ["Tipo", w.intervention_type],
                ["Objetivo", w.objective],
                ["Superficie", `${w.surface} m²`],
                ["Presupuesto", currency(w.budget)],
                ["Inicio", w.start_date],
                ["Finalización", w.end_date],
                [
                  "Coordenadas",
                  w.latitude !== null && w.longitude !== null
                    ? `${w.latitude}, ${w.longitude}`
                    : "Sin coordenadas",
                ],
                [
                  "Financiación",
                  w.funding
                    .map((f) => `${f.name || "Fuente"} ${currency(f.amount)}`)
                    .join(" · "),
                ],
                ["Consulta pública", w.public ? "Publicada" : "Privada"],
              ].map(([key, value]) => (
                <div key={key}>
                  <dt>{key}</dt>
                  <dd>{value || "Sin definir"}</dd>
                </div>
              ))}
            </dl>
            <div className="actions" style={{ marginTop: 26 }}>
              <button
                className="ghost"
                onClick={() =>
                  download(
                    `/works/${workId}/dossier.zip`,
                    `${w.code}-expediente.zip`,
                  )
                }
              >
                Descargar paquete de expediente
              </button>
              {has(directors) && (
                <button
                  className="ghost"
                  onClick={() =>
                    run(
                      `/works/${workId}`,
                      { version: w.version, public: !w.public },
                      "patch",
                    )
                  }
                >
                  {w.public
                    ? "Retirar publicación pública"
                    : "Publicar campos autorizados"}
                </button>
              )}
            </div>
          </Panel>
          {editing && <WorkForm work={w} onClose={() => setEditing(false)} />}{" "}
          {has(directors) && (
            <Panel title="Etapa y estado operativo">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = new FormData(e.currentTarget);
                  await run(`/works/${workId}/transition`, {
                    version: w.version,
                    stage: form.get("stage") || undefined,
                    status: form.get("status") || undefined,
                    reason: form.get("reason"),
                  });
                }}
              >
                <div className="form-grid">
                  <Field label="Siguiente etapa">
                    <select name="stage">
                      <option value="">Mantener etapa</option>
                      {w.stage === "proyecto" && (
                        <option value="obra">Pasar a obra</option>
                      )}
                      {w.stage === "obra" && (
                        <option value="posobra">Pasar a posobra</option>
                      )}
                    </select>
                  </Field>
                  <Field label="Estado operativo">
                    <select name="status">
                      <option value="">Mantener estado</option>
                      {[
                        "en_preparacion",
                        "en_ejecucion",
                        "observada",
                        "suspendida",
                        "finalizada",
                        "archivada",
                      ].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Motivo">
                    <input name="reason" required />
                  </Field>
                </div>
                <button>Registrar transición</button>
              </form>
            </Panel>
          )}
        </>
      )}
      {tab === "actores" && <Actors workId={workId} actors={actors} />}{" "}
      {tab === "documentos" && <Documents workId={workId} />}{" "}
      {tab === "rubrado" && <Contracts workId={workId} />}{" "}
      {tab === "cronograma" && <Schedules workId={workId} actors={actors} />}{" "}
      {tab === "registros" && (
        <Records workId={workId} actors={actors} stage={w.stage} />
      )}{" "}
      {tab === "certificados" && (
        <Certificates workId={workId} stage={w.stage} />
      )}{" "}
      {tab === "asistente" && <Assistant workId={workId} />}{" "}
      {tab === "historial" && <History workId={workId} />}
    </>
  );
}
function Actors({ workId, actors }: { workId: number; actors: Actor[] }) {
  const ref = useApi<
    Reference & { professionals: { id: number; name: string }[] }
  >("/reference");
  const run = useAction();
  return (
    <Panel title="Equipo, profesionales y asesores">
      <div className="record-list">
        {actors.map((a) => (
          <div className="record-card" key={a.id}>
            <div className="section-heading">
              <h3>{a.name}</h3>
              <Badge value={a.role} />
            </div>
            {Object.entries(a.contact).map(([key, value]) => (
              <small key={key}>
                {key}: {value}
              </small>
            ))}
            {has(directors) && (
              <Confirm
                text={`Retirar asignación de ${a.name}?`}
                onConfirm={() =>
                  run(`/works/${workId}/actors/${a.id}`, {}, "delete")
                }
              />
            )}
          </div>
        ))}
      </div>
      {has(directors) && (
        <form
          style={{ marginTop: 24 }}
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const selection = String(f.get("actor"));
            const [type, id] = selection.split(":");
            await run(`/works/${workId}/actors`, {
              [type === "user" ? "user_id" : "professional_id"]: Number(id),
              role: f.get("role"),
              contact: { email: f.get("email"), phone: f.get("phone") },
            });
          }}
        >
          <div className="form-grid">
            <Field label="Usuario interno o profesional">
              <select name="actor" required>
                <option value="">Seleccionar actor</option>
                {ref.data?.users.map((u) => (
                  <option key={`u${u.id}`} value={`user:${u.id}`}>
                    {u.name}
                  </option>
                ))}
                {ref.data?.professionals?.map((p) => (
                  <option key={`p${p.id}`} value={`professional:${p.id}`}>
                    {p.name} (profesional)
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Rol en la intervención">
              <input
                name="role"
                required
                placeholder="Proyecto, anteproyecto, asesoría…"
              />
            </Field>
            <Field label="Correo de contacto">
              <input name="email" type="email" />
            </Field>
            <Field label="Teléfono de contacto">
              <input name="phone" />
            </Field>
          </div>
          <button>Asignar actor</button>
        </form>
      )}
    </Panel>
  );
}
function History({ workId }: { workId: number }) {
  const rows = useApi<{
    history: {
      id: number;
      resource: string;
      resource_id: number;
      actor_id: number;
      action: string;
      previous: string;
      target: string;
      created_at: string;
      details: Record<string, unknown>;
    }[];
  }>(`/works/${workId}/history`);
  return (
    <Panel title="Historial y auditoría">
      <Status loading={rows.isLoading} error={rows.error} />
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Fecha UTC</th>
              <th>Actor</th>
              <th>Recurso</th>
              <th>Acción / estado</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {rows.data?.history.map((h) => (
              <tr key={h.id}>
                <td>{h.created_at}</td>
                <td>#{h.actor_id}</td>
                <td>
                  {h.resource} #{h.resource_id}
                </td>
                <td>
                  {h.action}
                  <small>
                    {h.previous} → {h.target}
                  </small>
                </td>
                <td>{JSON.stringify(h.details)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
