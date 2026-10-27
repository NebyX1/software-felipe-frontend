import { useState } from "react";
import { Link } from "react-router-dom";
import type { Line } from "../../domain/types";
import { useApi } from "../../domain/hooks";
import { Panel, Field, Status, currency } from "./UI";
type Price = Line & {
  work_id: number;
  work_name: string;
  locality: string;
  source: string;
  date: string;
  contract_kind: string;
  demo: boolean;
};
export default function HistoricPrices({
  onPick,
}: {
  onPick?: (line: Line) => void;
}) {
  const rows = useApi<{ prices: Price[] }>("/catalog/historic-prices");
  const [search, setSearch] = useState("");
  const visible =
    rows.data?.prices.filter((p) =>
      `${p.description} ${p.code} ${p.unit} ${p.work_name}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    ) || [];
  return (
    <Panel title="Precios observados en contratos aprobados">
      <p className="hint">
        Referencias con fuente, fecha y unidad. Revisá su contexto antes de
        reutilizar: no representan una tarifa vigente. Los registros de
        demostración son sintéticos.
      </p>
      <Field label="Buscar precio histórico">
        <input value={search} onChange={(e) => setSearch(e.target.value)} />
      </Field>
      <Status
        loading={rows.isLoading}
        error={rows.error}
        empty={!!rows.data && !visible.length}
      />
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Rubro</th>
              <th>Unidad</th>
              <th>Precio unitario UYU</th>
              <th>Fuente y fecha</th>
              {onPick && <th>Reutilizar</th>}
            </tr>
          </thead>
          <tbody>
            {visible.slice(0, 100).map((p, i) => (
              <tr key={`${p.id}-${i}`}>
                <td>
                  {p.code} · {p.description}
                </td>
                <td>{p.unit}</td>
                <td>{currency(p.unit_price)}</td>
                <td>
                  <Link to={`/obras/${p.work_id}?tab=rubrado`}>
                    {p.work_name}
                  </Link>
                  <small>
                    {p.source} · {p.date} · {p.locality} · {p.contract_kind}
                    {p.demo ? " · DEMO" : ""}
                  </small>
                </td>
                {onPick && (
                  <td>
                    <button
                      type="button"
                      className="ghost small"
                      onClick={() =>
                        onPick({
                          code: p.code,
                          chapter: p.chapter,
                          description: p.description,
                          unit: p.unit,
                          quantity: "1",
                          unit_price: p.unit_price,
                          social_rate: p.social_rate,
                          kind: p.kind,
                          icc_eligible: p.icc_eligible,
                        })
                      }
                    >
                      Agregar al rubrado
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
