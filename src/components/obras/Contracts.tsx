import { useState } from "react";
import type { Contract, Line, Reference } from "../../domain/types";
import { useApi, useAction } from "../../domain/hooks";
import { download } from "../../domain/api";
import { has, editors, directors } from "../../domain/session";
import { Badge, Field, Panel, Status, DecimalInput, currency } from "./UI";
import Imports from "./Imports";
import HistoricPrices from "./HistoricPrices";
const emptyLine = (): Line => ({
  code: "",
  chapter: "General",
  description: "",
  unit: "m2",
  quantity: "1",
  unit_price: "0",
  social_rate: "0",
  kind: "basico",
  icc_eligible: true,
});
export default function Contracts({ workId }: { workId: number }) {
  const rows = useApi<{ contracts: Contract[] }>(`/works/${workId}/contracts`);
  const ref = useApi<Reference>("/reference");
  const run = useAction();
  const [editing, setEditing] = useState(false);
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [initial, setInitial] = useState<Contract | null>(null);
  const [rules, setRules] = useState({
    iva_rate: "0.22",
    social_payment: "separado",
    icc_initial: "",
  });
  const [kind, setKind] = useState("inicial");
  const [historic, setHistoric] = useState(false);
  const change = (index: number, name: keyof Line, value: string | boolean) =>
    setLines((all) =>
      all.map((l, i) => (i === index ? { ...l, [name]: value } : l)),
    );
  return (
    <>
      <Panel
        title="Rubrados y contratos"
        actions={
          has(editors) && (
            <button
              onClick={() => {
                setEditing(true);
                setInitial(null);
                setLines([emptyLine()]);
              }}
            >
              Nuevo rubrado
            </button>
          )
        }
      >
        <Status
          loading={rows.isLoading}
          error={rows.error}
          empty={!rows.data?.contracts.length}
        />
        {rows.data?.contracts.map((c) => (
          <article
            key={c.id}
            className="record-card"
            style={{ marginBottom: 15 }}
          >
            <div className="section-heading">
              <h3>
                {c.kind} · versión {c.version} ·{" "}
                {c.number || "Sin adjudicación"}
              </h3>
              <Badge value={c.status} />
            </div>
            <p>
              {currency(c.amount)} · Empresa{" "}
              {ref.data?.companies.find((x) => x.id === c.company_id)?.name ||
                "Sin definir"}
            </p>
            <small>
              Licitación {c.tender_number || "—"} · Expediente{" "}
              {c.dossier_number || "—"} · BPS {c.bps_number || "—"} ·{" "}
              {c.start_date || "—"} → {c.end_date || "—"}
            </small>
            <small>
              IVA: {c.rules.iva_rate} · LLSS: {c.rules.social_payment} · ICC
              inicial: {c.rules.icc_initial || "No aplicable"} · Motivo:{" "}
              {c.reason || "Versión inicial"}
            </small>
            <details>
              <summary>Ver {c.lines.length} rubros</summary>
              <LineTable lines={c.lines} />
            </details>
            <div className="actions">
              {has(directors) && c.status === "borrador" && (
                <button
                  onClick={() =>
                    run(`/works/${workId}/contracts/${c.id}/approve`)
                  }
                >
                  Aprobar versión
                </button>
              )}
              {has(editors) && (
                <button
                  className="ghost"
                  onClick={() => {
                    setInitial(c);
                    setLines(c.lines.map((l) => ({ ...l })));
                    setRules({
                      ...c.rules,
                      icc_initial: c.rules.icc_initial || "",
                    });
                    setKind(c.kind);
                    setEditing(true);
                  }}
                >
                  Editar en nueva versión
                </button>
              )}
              {["xlsx", "csv", "pdf"].map((f) => (
                <button
                  key={f}
                  className="ghost small"
                  onClick={() =>
                    download(
                      `/works/${workId}/contracts/${c.id}/export.${f}`,
                      `rubrado-v${c.version}.${f}`,
                    )
                  }
                >
                  Exportar {f}
                </button>
              ))}
            </div>
          </article>
        ))}
      </Panel>
      {editing && (
        <>
          <Panel
            title={
              initial
                ? `Revisión del rubrado v${initial.version}`
                : "Preparar rubrado"
            }
          >
            <form
              key={initial?.id || "new"}
              onSubmit={async (e) => {
                e.preventDefault();
                const data = Object.fromEntries(new FormData(e.currentTarget));
                const payload = {
                  ...data,
                  kind,
                  company_id: data.company_id ? Number(data.company_id) : null,
                  rules: {
                    ...rules,
                    icc_initial: rules.icc_initial || undefined,
                  },
                  lines: lines.map(({ id: _id, ...l }) => l),
                };
                if (await run(`/works/${workId}/contracts`, payload))
                  setEditing(false);
              }}
            >
              <div className="form-grid">
                <Field label="Rubrado">
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value)}
                  >
                    <option value="inicial">Inicial / preobra</option>
                    <option value="contractual">
                      Contractual / adjudicado
                    </option>
                  </select>
                </Field>
                <Field label="Empresa">
                  <select
                    name="company_id"
                    defaultValue={initial?.company_id || ""}
                  >
                    <option value="">Sin adjudicar</option>
                    {ref.data?.companies.map((c) => (
                      <option value={c.id} key={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
                {[
                  ["number", "Número de contrato"],
                  ["tender_number", "Licitación"],
                  ["dossier_number", "Expediente"],
                  ["bps_number", "Registro BPS"],
                  ["procurement_type", "Tipo de contratación"],
                  ["start_date", "Inicio"],
                  ["end_date", "Fin"],
                ].map(([key, caption]) => (
                  <Field label={caption} key={key}>
                    <input
                      name={key}
                      type={key.endsWith("date") ? "date" : "text"}
                      defaultValue={String(
                        initial?.[key as keyof Contract] || "",
                      )}
                    />
                  </Field>
                ))}
                <Field label="IVA contractual (fracción, ej. 0.22)">
                  <DecimalInput
                    value={rules.iva_rate}
                    onChange={(e) =>
                      setRules({ ...rules, iva_rate: e.target.value })
                    }
                  />
                </Field>
                <Field label="Pago de leyes sociales">
                  <select
                    value={rules.social_payment}
                    onChange={(e) =>
                      setRules({ ...rules, social_payment: e.target.value })
                    }
                  >
                    <option value="separado">
                      Separado del pago a empresa
                    </option>
                    <option value="incluido">Incluido en pago</option>
                  </select>
                </Field>
                <Field label="ICC inicial (vacío = no aplicar)">
                  <DecimalInput
                    value={rules.icc_initial}
                    onChange={(e) =>
                      setRules({ ...rules, icc_initial: e.target.value })
                    }
                  />
                </Field>
              </div>
              <Field label="Motivo / alcance de revisión">
                <textarea name="reason" required={!!initial} />
              </Field>
              <button
                type="button"
                className="ghost"
                onClick={() => setHistoric(!historic)}
              >
                {historic
                  ? "Cerrar precios históricos"
                  : "Consultar precios históricos"}
              </button>
              {historic && (
                <HistoricPrices
                  onPick={(line) =>
                    setLines((all) => [
                      ...all,
                      {
                        ...line,
                        code: all.some((l) => l.code === line.code)
                          ? `${line.code}-H${all.length + 1}`
                          : line.code,
                      },
                    ])
                  }
                />
              )}
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Código / capítulo</th>
                      <th>Descripción</th>
                      <th>Unidad</th>
                      <th>Cantidad</th>
                      <th>Precio unitario UYU</th>
                      <th>LLSS (fracción)</th>
                      <th>Tipo / ICC</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l, i) => (
                      <tr key={i}>
                        <td>
                          <input
                            required
                            value={l.code}
                            aria-label={`Código ${i + 1}`}
                            onChange={(e) => change(i, "code", e.target.value)}
                          />
                          <input
                            value={l.chapter}
                            aria-label={`Capítulo ${i + 1}`}
                            onChange={(e) =>
                              change(i, "chapter", e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            required
                            value={l.description}
                            aria-label={`Descripción ${i + 1}`}
                            onChange={(e) =>
                              change(i, "description", e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <select
                            value={l.unit}
                            aria-label={`Unidad ${i + 1}`}
                            onChange={(e) => change(i, "unit", e.target.value)}
                          >
                            {[
                              "m2",
                              "m3",
                              "ml",
                              "un",
                              "global",
                              "kg",
                              "h",
                              "l",
                              "t",
                            ].map((u) => (
                              <option key={u}>{u}</option>
                            ))}
                          </select>
                        </td>
                        {(
                          ["quantity", "unit_price", "social_rate"] as const
                        ).map((key) => (
                          <td key={key}>
                            <DecimalInput
                              value={l[key]}
                              aria-label={`${key} ${i + 1}`}
                              onChange={(e) => change(i, key, e.target.value)}
                            />
                          </td>
                        ))}
                        <td>
                          <select
                            value={l.kind}
                            aria-label={`Tipo ${i + 1}`}
                            onChange={(e) => change(i, "kind", e.target.value)}
                          >
                            {["basico", "imprevisto", "ampliacion"].map((k) => (
                              <option key={k}>{k}</option>
                            ))}
                          </select>
                          <label>
                            <input
                              type="checkbox"
                              checked={l.icc_eligible}
                              onChange={(e) =>
                                change(i, "icc_eligible", e.target.checked)
                              }
                            />{" "}
                            Elegible ICC
                          </label>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="ghost danger small"
                            onClick={() =>
                              setLines(lines.filter((_, j) => j !== i))
                            }
                          >
                            Quitar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="actions" style={{ marginTop: 15 }}>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => setLines([...lines, emptyLine()])}
                >
                  Agregar rubro
                </button>
                <select
                  aria-label="Agregar rubro o precio del catálogo"
                  value=""
                  onChange={(e) => {
                    const entry = ref.data?.catalog.find(
                      (c) => c.id === Number(e.target.value),
                    );
                    if (entry)
                      setLines([
                        ...lines,
                        {
                          ...emptyLine(),
                          code: entry.code,
                          description: entry.label,
                          unit: entry.data.unit || "m2",
                          unit_price: entry.data.unit_price || "0",
                          social_rate: entry.data.social_rate || "0",
                          chapter: entry.data.chapter || "Catálogo",
                        },
                      ]);
                  }}
                >
                  <option value="">
                    Agregar desde catálogo / precios con fuente
                  </option>
                  {ref.data?.catalog
                    .filter((c) => ["rubro", "precio"].includes(c.kind))
                    .map((c) => (
                      <option value={c.id} key={c.id}>
                        {c.label} · {c.data.source || "Rubro sin precio"} ·{" "}
                        {c.data.date || ""}
                      </option>
                    ))}
                </select>
                <button>Guardar nueva versión</button>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => setEditing(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </Panel>
          <Imports workId={workId} contract={{ kind, rules }} />
        </>
      )}
    </>
  );
}
export function LineTable({ lines }: { lines: Line[] }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Código / capítulo</th>
            <th>Descripción</th>
            <th>Unidad</th>
            <th>Cantidad</th>
            <th>Precio UYU</th>
            <th>LLSS</th>
            <th>Tipo</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={l.code + i}>
              <td>
                {l.code}
                <small>{l.chapter}</small>
              </td>
              <td>{l.description}</td>
              <td>{l.unit}</td>
              <td>{l.quantity}</td>
              <td>{currency(l.unit_price)}</td>
              <td>{l.social_rate}</td>
              <td>{l.kind}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
