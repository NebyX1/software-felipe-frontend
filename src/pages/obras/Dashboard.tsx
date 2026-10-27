import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FiPlus, FiArrowUpRight } from "react-icons/fi";
import type { Work, Reference } from "../../domain/types";
import { useApi } from "../../domain/hooks";
import { download } from "../../domain/api";
import { has, editors } from "../../domain/session";
import {
  Badge,
  Field,
  Panel,
  Status,
  Progress,
  currency,
} from "../../components/obras/UI";
import Overview from "../../components/obras/Overview";
import WorkForm from "../../components/obras/WorkForm";
export interface DashboardSummary {
  funding: { name: string; amount: string }[];
  years: Record<string, { count: number; budget: string }>;
  count: number;
  surface: string;
  budget: string;
  certified: string;
  paid: string;
  stages: Record<string, number>;
  alerts: {
    id: number;
    work_id: number;
    title: string;
    due_date: string;
    kind: string;
    overdue: boolean;
  }[];
}
export default function Dashboard({
  listOnly = false,
}: {
  listOnly?: boolean;
}) {
  const [params, setParams] = useSearchParams();
  const [creating, setCreating] = useState(false);
  const query = params.toString();
  const works = useApi<{
    works: Work[];
    pages: number;
    page: number;
    total: number;
  }>(`/works?${query}`);
  const mapWorks = useApi<{ works: Work[] }>(`/works/map?${query}`);
  const reference = useApi<Reference>("/reference");
  const summary = useApi<DashboardSummary>(`/dashboard?${query}`);
  const scenarios = useApi<{ works: Work[] }>("/demo/scenarios", !listOnly);
  const filter = (name: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    next.delete("page");
    setParams(next);
  };
  if (!listOnly)
    return (
      <Overview
        summary={summary.data}
        works={works.data?.works || []}
        mapWorks={mapWorks.data?.works || []}
        scenarios={scenarios.data?.works || []}
        loading={works.isLoading || summary.isLoading}
        error={works.error || summary.error}
        creating={creating}
        onCreate={() => setCreating(true)}
        onClose={() => setCreating(false)}
      />
    );
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">CARTERA DE PROYECTOS</span>
          <h1>Intervenciones</h1>
          <p>
            Explorá el plan de obras y seguí cada proyecto del departamento.
          </p>
        </div>
        {has(editors) && (
          <button onClick={() => setCreating(!creating)}>
            <FiPlus /> Nueva intervención
          </button>
        )}
      </div>
      {creating && <WorkForm onClose={() => setCreating(false)} />}
      <div className="filters">
        <Field label="Buscar">
          <input
            value={params.get("q") || ""}
            placeholder="Nombre de intervención"
            onChange={(e) => filter("q", e.target.value)}
          />
        </Field>
        <Field label="Etapa">
          <select
            value={params.get("stage") || ""}
            onChange={(e) => filter("stage", e.target.value)}
          >
            <option value="">Todas las etapas</option>
            {["proyecto", "obra", "posobra"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Localidad">
          <input
            value={params.get("locality") || ""}
            placeholder="Todas"
            onChange={(e) => filter("locality", e.target.value)}
          />
        </Field>
        <Field label="Objetivo">
          <input
            value={params.get("objective") || ""}
            placeholder="Todos"
            onChange={(e) => filter("objective", e.target.value)}
          />
        </Field>
        <Field label="Ordenar">
          <select
            value={params.get("sort") || "created_at"}
            onChange={(e) => filter("sort", e.target.value)}
          >
            <option value="created_at">Más recientes</option>
            <option value="budget">Presupuesto</option>
            <option value="name">Nombre</option>
            <option value="start_date">Fecha de inicio</option>
          </select>
        </Field>
        <Field label="Estado">
          <select
            value={params.get("status") || ""}
            onChange={(e) => filter("status", e.target.value)}
          >
            <option value="">Todos</option>
            {[
              "planificada",
              "en_preparacion",
              "en_ejecucion",
              "suspendida",
              "observada",
              "finalizada",
              "archivada",
            ].map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </Field>
        <Field label="Responsable">
          <select
            value={params.get("responsible_id") || ""}
            onChange={(e) => filter("responsible_id", e.target.value)}
          >
            <option value="">Todos</option>
            {reference.data?.users.map((u) => (
              <option value={u.id} key={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Desde año">
          <input
            type="number"
            min={1900}
            max={2200}
            value={params.get("year_from") || ""}
            onChange={(e) => filter("year_from", e.target.value)}
          />
        </Field>
        <Field label="Hasta año">
          <input
            type="number"
            min={1900}
            max={2200}
            value={params.get("year_to") || ""}
            onChange={(e) => filter("year_to", e.target.value)}
          />
        </Field>
        <button className="ghost" onClick={() => setParams({})}>
          Limpiar filtros
        </button>
      </div>
      <Status loading={works.isLoading} error={works.error || summary.error} />
      {summary.data && (
        <div className="metrics-grid">
          <div className="metric">
            <small>Intervenciones</small>
            <strong>{summary.data.count}</strong>
            <span>{summary.data.surface} m² de superficie</span>
          </div>
          <div className="metric">
            <small>Presupuesto estimado</small>
            <strong>{currency(summary.data.budget)}</strong>
            <span>Ficha del plan de obras</span>
          </div>
          <div className="metric">
            <small>Certificado aprobado</small>
            <strong>{currency(summary.data.certified)}</strong>
            <span>Solo aprobación definitiva</span>
          </div>
          <div className="metric">
            <small>Pago ficticio registrado</small>
            <strong>{currency(summary.data.paid)}</strong>
            <span>Circuito administrativo completo</span>
          </div>
        </div>
      )}
      <Panel
        title="Listado de intervenciones"
        actions={
          <div className="actions">
            {["pdf", "xlsx", "csv"].map((format) => (
              <button
                className="ghost small"
                key={format}
                onClick={() =>
                  download(
                    `/reports/works.${format}?${query}`,
                    `obras.${format}`,
                  )
                }
              >
                Exportar {format.toUpperCase()}
              </button>
            ))}
          </div>
        }
      >
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Intervención</th>
                <th>Etapa / estado</th>
                <th>Presupuesto</th>
                <th>Avance físico</th>
                <th>Plazo previsto</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {works.data?.works.map((w) => (
                <tr key={w.id}>
                  <td>
                    <Link to={`/obras/${w.id}`}>
                      <strong>{w.name}</strong>
                    </Link>
                    <small>
                      {w.locality} · {w.code}
                    </small>
                  </td>
                  <td>
                    <Badge value={w.stage} />
                    <small>{w.status.replaceAll("_", " ")}</small>
                  </td>
                  <td>{currency(w.budget)}</td>
                  <td>
                    {w.metrics?.physical_percent}%
                    <Progress value={w.metrics?.physical_percent || "0"} />
                  </td>
                  <td>{w.end_date || "Sin definir"}</td>
                  <td>
                    <Link aria-label={`Abrir ${w.name}`} to={`/obras/${w.id}`}>
                      <FiArrowUpRight />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Status empty={works.data?.total === 0} />
        <div className="pagination">
          <span>
            {works.data?.total || 0} intervenciones · Página{" "}
            {works.data?.page || 1} de {Math.max(1, works.data?.pages || 1)}
          </span>
          <button
            className="ghost"
            disabled={(works.data?.page || 1) <= 1}
            onClick={() => {
              params.set("page", String((works.data?.page || 1) - 1));
              setParams(params);
            }}
          >
            Anterior
          </button>
          <button
            className="ghost"
            disabled={(works.data?.page || 1) >= (works.data?.pages || 1)}
            onClick={() => {
              params.set("page", String((works.data?.page || 1) + 1));
              setParams(params);
            }}
          >
            Siguiente
          </button>
        </div>
      </Panel>
    </>
  );
}
