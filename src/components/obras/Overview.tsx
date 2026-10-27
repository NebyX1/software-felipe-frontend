import { Link } from "react-router-dom";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  FiActivity,
  FiArrowRight,
  FiArrowUpRight,
  FiBarChart2,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiFileText,
  FiGlobe,
  FiInbox,
  FiMapPin,
  FiPlus,
} from "react-icons/fi";
import type { Work } from "../../domain/types";
import type { DashboardSummary } from "../../pages/obras/Dashboard";
import { has, editors } from "../../domain/session";
import { useTheme } from "../../domain/theme";
import { Badge, Panel, Status, currency } from "./UI";
import WorksMap from "./Map";
import WorkForm from "./WorkForm";

interface Props {
  summary?: DashboardSummary;
  works: Work[];
  mapWorks: Work[];
  scenarios: Work[];
  loading: boolean;
  error?: unknown;
  creating: boolean;
  onCreate: () => void;
  onClose: () => void;
}

const compact = (value: string | number) =>
  new Intl.NumberFormat("es-UY", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

function shortDate(value: string) {
  if (!value) return "Sin fecha";
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("es-UY", {
        day: "2-digit",
        month: "short",
      }).format(date);
}

const launchers = [
  {
    to: "/obras",
    icon: FiBriefcase,
    title: "Intervenciones",
    text: "Cada proyecto, de principio a fin.",
  },
  {
    to: "/pagos",
    icon: FiFileText,
    title: "Pagos de obra",
    text: "Órdenes y comprobantes.",
  },
  {
    to: "/bandeja",
    icon: FiInbox,
    title: "Bandeja de trabajo",
    text: "Tu equipo y sus próximos pasos.",
  },
  {
    to: "/guia-demo",
    icon: FiCheckCircle,
    title: "Guía de la demo",
    text: "Un recorrido para empezar a explorar.",
  },
];

export default function Overview({
  summary,
  works,
  mapWorks,
  scenarios,
  loading,
  error,
  creating,
  onCreate,
  onClose,
}: Props) {
  const { theme } = useTheme();
  const stageColors =
    theme === "neon"
      ? ["#ff654e", "#f5b467", "#81b8a0"]
      : ["#6376ed", "#c299e4", "#5eaeba"];
  const stages = ["proyecto", "obra", "posobra"].map((name, index) => ({
    name,
    value: summary?.stages[name] || 0,
    color: stageColors[index],
  }));
  const featured = scenarios.length ? scenarios : works.slice(0, 5);
  const alerts = summary?.alerts.slice(0, 4) || [];

  return (
    <div className="dashboard-page">
      <div className="dashboard-primary">
        <section className="command-hero" aria-labelledby="dashboard-title">
          <div className="hero-copy">
            <span className="eyebrow">DIRECCIÓN DE OBRAS · LAVALLEJA</span>
            <h1 id="dashboard-title">
              Cada obra.
              <br />
              Un futuro en marcha.
            </h1>
            <p>
              Proyectos conectados. Decisiones claras.
              <br />
              Todo el territorio, en un solo lugar.
            </p>
            <div className="hero-buttons">
              {has(editors) && (
                <button onClick={onCreate}>
                  <FiPlus /> Nueva intervención
                </button>
              )}
              <Link
                to="/obras"
                className="hero-explore"
                aria-label="Explorar el plan de obras"
              >
                <FiArrowUpRight />
              </Link>
            </div>
          </div>
          <div className="hero-caption">
            <span className="live-dot" /> Proyecto <i>/</i> Obra <i>/</i>{" "}
            Posobra{" "}
            <span className="hero-caption-right">
              Una historia conectada <FiArrowRight />
            </span>
          </div>
        </section>

        {creating && (
          <div className="create-work-region">
            <WorkForm onClose={onClose} />
          </div>
        )}
        <div className="launch-grid">
          {launchers.map(({ to, icon: Icon, title, text }) => (
            <Link to={to} className="launch-card" key={to}>
              <span className="launch-icon">
                <Icon />
              </span>
              <strong>{title}</strong>
              <p>{text}</p>
              <FiArrowUpRight className="launch-arrow" />
            </Link>
          ))}
        </div>

        <Status loading={loading} error={error} />
        <div className="overview-grid">
          <Panel
            title="Obras en el territorio"
            actions={
              <span className="panel-meta">
                <FiMapPin /> Lavalleja
              </span>
            }
          >
            <WorksMap works={mapWorks} />
          </Panel>
          <Panel
            title="Etapas del plan"
            actions={<FiActivity className="panel-heading-icon" />}
          >
            <p className="panel-description">
              Del proyecto a su vida en el territorio.
            </p>
            <div className="plan-stage-layout">
              <div className="donut-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stages}
                      dataKey="value"
                      innerRadius="73%"
                      outerRadius="95%"
                      paddingAngle={4}
                      stroke="none"
                      isAnimationActive={false}
                    >
                      {stages.map((stage) => (
                        <Cell fill={stage.color} key={stage.name} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, "Intervenciones"]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-total">
                  <strong>{summary?.count ?? "—"}</strong>
                  <span>intervenciones</span>
                </div>
              </div>
              <div className="stage-breakdown">
                {stages.map((stage) => (
                  <div key={stage.name}>
                    <div className="stage-row">
                      <span>
                        <i style={{ background: stage.color }} />
                        {stage.name}
                      </span>
                      <strong>{stage.value}</strong>
                    </div>
                    <div className="stage-bar">
                      <span
                        style={{
                          width: `${summary?.count ? (stage.value / summary.count) * 100 : 0}%`,
                          background: stage.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="plan-note">
              <FiCheckCircle />
              <span>Seguimiento de las tres etapas del ciclo de obra.</span>
            </div>
          </Panel>
        </div>

        <Panel
          title="Intervenciones destacadas"
          actions={
            <Link to="/obras" className="text-action">
              Ver todas <FiArrowUpRight />
            </Link>
          }
        >
          <div className="table-scroll featured-table">
            <table>
              <thead>
                <tr>
                  <th>Intervención</th>
                  <th>Etapa</th>
                  <th>Presupuesto</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {featured.map((work) => (
                  <tr key={work.id}>
                    <td>
                      <Link
                        to={`/obras/${work.id}`}
                        className="featured-work-name"
                      >
                        <span className="work-symbol">
                          <FiBriefcase />
                        </span>
                        <span>
                          <strong>
                            {work.name.replace(
                              /\s*·\s*(Obra Demo|Ejecución Demo|Posobra Demo|Proyecto Demo|Demo Tesorería)$/,
                              "",
                            )}
                          </strong>
                          <small>
                            {work.locality} · {work.code}
                          </small>
                        </span>
                      </Link>
                    </td>
                    <td>
                      <Badge value={work.stage} />
                    </td>
                    <td className="featured-budget">{currency(work.budget)}</td>
                    <td>
                      <Link
                        to={`/obras/${work.id}`}
                        className="row-arrow"
                        aria-label={`Abrir ${work.name}`}
                      >
                        <FiArrowUpRight />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Status empty={!loading && !featured.length} />
        </Panel>

        {summary && (
          <details className="financing-details">
            <summary>
              <span>
                <FiBarChart2 /> Financiación y horizonte del plan
              </span>
              <FiPlus />
            </summary>
            <div className="financing-grid">
              <div>
                <h3>Fuentes declaradas</h3>
                {summary.funding.map((source) => (
                  <div className="funding-line" key={source.name}>
                    <span>{source.name}</span>
                    <strong>{currency(source.amount)}</strong>
                  </div>
                ))}
              </div>
              <div>
                <h3>Por año de inicio</h3>
                {Object.entries(summary.years).map(([year, info]) => (
                  <div className="funding-line" key={year}>
                    <span>
                      {year} · {info.count} intervenciones
                    </span>
                    <strong>{currency(info.budget)}</strong>
                  </div>
                ))}
              </div>
            </div>
            <small>
              Presupuestos estimados. La distribución no representa flujo de
              caja.
            </small>
          </details>
        )}
      </div>

      <aside
        className="dashboard-rail"
        aria-label="Resumen y próximos compromisos"
      >
        <section className="rail-section">
          <div className="rail-heading">
            <h2>
              <FiBarChart2 /> Resumen del plan
            </h2>
            <span>UYU</span>
          </div>
          <div className="rail-metrics">
            <div className="rail-metric">
              <div>
                <small>Intervenciones</small>
                <strong>{summary?.count ?? "—"}</strong>
                <span>
                  {summary
                    ? `${Number(summary.surface).toLocaleString("es-UY")} m² de superficie`
                    : "Cargando plan…"}
                </span>
              </div>
              <FiBriefcase />
            </div>
            <div className="rail-metric">
              <div>
                <small>Presupuesto del plan</small>
                <strong title={currency(summary?.budget || 0)}>
                  {summary ? `$ ${compact(summary.budget)}` : "—"}
                </strong>
                <span>Estimado en fichas de obra</span>
              </div>
              <FiBarChart2 />
            </div>
            <div className="rail-metric">
              <div>
                <small>Certificado aprobado</small>
                <strong title={currency(summary?.certified || 0)}>
                  {summary ? `$ ${compact(summary.certified)}` : "—"}
                </strong>
                <span className="positive">
                  <FiCheckCircle /> Aprobación definitiva
                </span>
              </div>
              <FiFileText />
            </div>
            <div className="rail-metric">
              <div>
                <small>Pagos registrados</small>
                <strong title={currency(summary?.paid || 0)}>
                  {summary ? `$ ${compact(summary.paid)}` : "—"}
                </strong>
                <span>Simulación de tesorería</span>
              </div>
              <FiCreditCard />
            </div>
          </div>
        </section>
        <section className="rail-card">
          <div className="rail-heading">
            <h2>
              <FiActivity /> Accesos rápidos
            </h2>
          </div>
          <div className="quick-actions">
            {has(editors) && (
              <button className="quick-create" onClick={onCreate}>
                <FiPlus /> Nueva intervención <FiArrowUpRight />
              </button>
            )}
            <Link to="/pagos">
              <FiCreditCard /> Probar un pago <FiArrowUpRight />
            </Link>
            <Link to="/bandeja">
              <FiInbox /> Revisar bandeja <FiArrowUpRight />
            </Link>
            <Link to="/publico">
              <FiGlobe /> Consulta pública <FiArrowUpRight />
            </Link>
          </div>
        </section>
        <section className="rail-card milestone-card">
          <div className="rail-heading">
            <h2>
              <FiClock /> Próximos hitos
            </h2>
            <Link to="/bandeja" aria-label="Ver todos los compromisos">
              <FiArrowUpRight />
            </Link>
          </div>
          <div className="milestone-list">
            {alerts.map((alert) => (
              <Link to={`/obras/${alert.work_id}?tab=registros`} key={alert.id}>
                <span
                  className={`milestone-icon ${alert.overdue ? "overdue" : ""}`}
                >
                  <FiCalendar />
                </span>
                <div>
                  <strong>{alert.title}</strong>
                  <small className={alert.overdue ? "overdue-label" : ""}>
                    {shortDate(alert.due_date)} ·{" "}
                    {alert.overdue ? "Vencido" : "Próximo"}
                  </small>
                </div>
              </Link>
            ))}
          </div>
          {!loading && !alerts.length && (
            <p className="rail-empty">No hay vencimientos pendientes.</p>
          )}
        </section>
        <div className="rail-footer">
          <span className="live-dot" /> Entorno de demostración{" "}
          <small>Aprobaciones y pagos ficticios</small>
        </div>
      </aside>
    </div>
  );
}
