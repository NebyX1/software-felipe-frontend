import { Link } from "react-router-dom";
import { useApi } from "../../domain/hooks";
import type { Work } from "../../domain/types";
import WorksMap from "../../components/obras/Map";
import { Badge, Panel, Status, currency } from "../../components/obras/UI";
import ThemeToggle from "../../components/obras/ThemeToggle";
export default function Public() {
  const works = useApi<{ works: Work[] }>("/public/works");
  return (
    <main className="public-page">
      <div className="public-toolbar">
      <Link to="/login">← Ingresar a gestión</Link>
        <ThemeToggle />
      </div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">LAVALLEJA · DATOS PÚBLICOS</span>
          <h1>Obras en el territorio</h1>
          <p>Información de intervenciones con publicación autorizada.</p>
        </div>
        <a
          className="button ghost"
          href="/api/public/geojson"
          download="obras-publicas.geojson"
        >
          Descargar GeoJSON
        </a>
      </div>
      <Status loading={works.isLoading} error={works.error} />
      <WorksMap works={works.data?.works || []} publicView />
      <Panel title="Plan de obras">
        <div className="work-cards">
          {works.data?.works.map((w) => (
            <article key={w.id}>
              <Badge value={w.stage} />
              <h2>{w.name}</h2>
              <p>
                {w.locality} · {w.intervention_type}
              </p>
              <strong>{currency(w.budget)}</strong>
              <small>
                {w.surface} m² · {w.objective}
              </small>
            </article>
          ))}
        </div>
      </Panel>
    </main>
  );
}
