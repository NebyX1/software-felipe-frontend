import { useState } from "react";
import { Link } from "react-router-dom";
import { useApi, useAction } from "../../domain/hooks";
import type { Procedure } from "../../components/obras/Procedures";
import type { WorkRecord, Cert } from "../../domain/types";
import { Panel, Field, Badge, Status } from "../../components/obras/UI";
export interface Notice {
  id: number;
  title: string;
  work_id: number;
  resource: string;
  resource_id: number;
  read_at: string | null;
  created_at: string;
}
export default function Inbox() {
  const rows = useApi<{
    procedures: Procedure[];
    records: (WorkRecord & { work_id: number; work_name: string })[];
    certificates: (Cert & { work_id: number; work_name: string })[];
  }>("/inbox");
  const [noticePage, setNoticePage] = useState(1);
  const notices = useApi<{
    notifications: Notice[];
    unread: number;
    pages: number;
    total: number;
  }>(`/notifications?page=${noticePage}`);
  const run = useAction();
  const [search, setSearch] = useState("");
  const [onlyMine, setOnlyMine] = useState(false);
  const [open, setOpen] = useState(true);
  const [unit, setUnit] = useState("");
  const ref = useApi<import("../../domain/types").Reference>("/reference");
  const userId = useSession((s) => s.user?.id);
  const match = (name: string) =>
    name.toLowerCase().includes(search.toLowerCase());
  const procedures =
    rows.data?.procedures.filter(
      (p) =>
        match(`${p.title} ${p.work_name}`) &&
        (!open || !["archivado", "aprobado", "rechazado"].includes(p.status)) &&
        (!onlyMine || p.responsible_id === userId || p.author_id === userId) &&
        (!unit || p.unit_id === Number(unit)),
    ) || [];
  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">SEGUIMIENTO Y PLAZOS</div>
          <h1>Bandeja de trabajo</h1>
          <p>
            Trámites, certificaciones pendientes, compromisos y notificaciones.
          </p>
        </div>
      </div>
      <Panel title={`Notificaciones · ${notices.data?.unread || 0} sin leer`}>
        <Status
          loading={notices.isLoading}
          error={notices.error}
          empty={!!notices.data && !notices.data.notifications.length}
        />
        <div className="notice-list">
          {notices.data?.notifications.map((n) => (
            <div className={`notice ${n.read_at ? "read" : ""}`} key={n.id}>
              <div>
                <Link
                  to={`/obras/${n.work_id}?tab=${n.resource === "tramite" ? "tramites" : n.resource === "registro" ? "registros" : "certificados"}`}
                >
                  {n.title}
                </Link>
                <small>{new Date(n.created_at).toLocaleString("es-UY")}</small>
              </div>
              {!n.read_at && (
                <button
                  className="ghost small"
                  onClick={() => run(`/notifications/${n.id}/read`)}
                >
                  Marcar leído
                </button>
              )}
            </div>
          ))}
        </div>
      </Panel>
      <div className="actions">
        <button
          className="ghost"
          disabled={noticePage <= 1}
          onClick={() => setNoticePage((p) => p - 1)}
        >
          Avisos anteriores
        </button>
        <small>
          Página {noticePage} de {notices.data?.pages || 1} ·{" "}
          {notices.data?.total || 0} avisos
        </small>
        <button
          className="ghost"
          disabled={noticePage >= (notices.data?.pages || 1)}
          onClick={() => setNoticePage((p) => p + 1)}
        >
          Más avisos
        </button>
      </div>
      <Panel title="Trámites documentales">
        <div className="form-grid">
          <Field label="Buscar en la bandeja">
            <input value={search} onChange={(e) => setSearch(e.target.value)} />
          </Field>
          <Field label="Unidad de la bandeja">
            <select value={unit} onChange={(e) => setUnit(e.target.value)}>
              <option value="">Todas las unidades</option>
              {ref.data?.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="actions">
          <label>
            <input
              type="checkbox"
              checked={onlyMine}
              onChange={(e) => setOnlyMine(e.target.checked)}
            />{" "}
            Mis trámites
          </label>
          <label>
            <input
              type="checkbox"
              checked={open}
              onChange={(e) => setOpen(e.target.checked)}
            />{" "}
            Sólo abiertos
          </label>
        </div>
        <Status
          loading={rows.isLoading}
          error={rows.error}
          empty={!!rows.data && !procedures.length}
        />
        {procedures.map((p) => (
          <article className="record-card" key={p.id}>
            <div className="section-heading">
              <Link to={`/obras/${p.work_id}?tab=tramites`}>
                #{p.id} · {p.title}
              </Link>
              <Badge value={p.status} />
            </div>
            <p>
              {p.work_name} · Plazo: {p.due_date || "Sin plazo"}
            </p>
          </article>
        ))}
      </Panel>
      <Panel title="Certificaciones pendientes">
        {rows.data?.certificates
          .filter((c) => match(c.work_name))
          .map((c) => (
            <div className="notice" key={c.id}>
              <Link to={`/obras/${c.work_id}?tab=certificados`}>
                {c.work_name} · {c.period}
              </Link>
              <Badge value={c.status} />
            </div>
          ))}
      </Panel>
      <Panel title="Compromisos abiertos">
        {rows.data?.records
          .filter(
            (r) =>
              match(`${r.title} ${r.work_name}`) &&
              (!onlyMine || r.responsible_id === userId),
          )
          .map((r) => (
            <div className="notice" key={r.id}>
              <div>
                <Link to={`/obras/${r.work_id}?tab=registros`}>{r.title}</Link>
                <small>
                  {r.work_name} · {r.due_date || "Sin plazo"}
                </small>
              </div>
              <Badge value={r.status} />
            </div>
          ))}
      </Panel>
    </>
  );
}
import { useSession } from "../../domain/session";
