import { useState } from "react";
import { action } from "../../domain/api";
import { useRefresh } from "../../domain/hooks";
import type { ImportBatch, Contract } from "../../domain/types";
import { Panel, Field, Badge } from "./UI";
export default function Imports({
  workId,
  contract,
  onAdvances,
  professional = false,
}: {
  workId: number;
  contract?: Partial<Contract>;
  onAdvances?: (values: Record<string, string>, mode: string) => void;
  professional?: boolean;
}) {
  const [batch, setBatch] = useState<ImportBatch | null>(null);
  const [busy, setBusy] = useState(false);
  const [proposal, setProposal] = useState<unknown>(null);
  const refresh = useRefresh();
  return (
    <Panel title="Importar planilla · previsualización y confirmación">
      <p className="hint">
        Se conserva el original. Fórmulas, unidades y referencias externas se
        verifican antes de permitir la confirmación. Corregí los errores en la
        fuente y volvé a cargarla.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const r = await action<{ import: ImportBatch }>(
              `/works/${workId}/imports/preview`,
              new FormData(e.currentTarget),
            );
            setBatch(r.import);
          } catch {
            /* surfaced */
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="form-grid">
          <Field label="Planilla XLSX u ODS">
            <input type="file" name="file" accept=".xlsx,.ods" required />
          </Field>
          <Field label="Contenido">
            <select
              name="kind"
              defaultValue={
                professional
                  ? "profesionales"
                  : onAdvances
                    ? "avance"
                    : "rubrado"
              }
            >
              {professional ? (
                <option value="profesionales">
                  Registro profesional privado
                </option>
              ) : onAdvances ? (
                <option value="avance">Avances</option>
              ) : (
                <option value="rubrado">Rubrado</option>
              )}
            </select>
          </Field>
          <Field label="Hoja (vacío = primera)">
            <input name="sheet" />
          </Field>
          <Field label="Columna de avance (ej. AX / P)">
            <input name="advance_column" />
          </Field>
        </div>
        <button disabled={busy}>
          {busy ? "Analizando…" : "Previsualizar original"}
        </button>
      </form>
      {batch && (
        <>
          <div className="section-heading" style={{ marginTop: 22 }}>
            <h3>
              {batch.preview.sheet} · {batch.preview.rows.length} filas
            </h3>
            <Badge value={batch.status} />
          </div>
          {batch.preview.errors.map((s, i) => (
            <p className="error" key={i}>
              {s}
            </p>
          ))}
          {batch.preview.warnings.length > 0 && (
            <details>
              <summary>{batch.preview.warnings.length} advertencias</summary>
              {batch.preview.warnings.map((s, i) => (
                <p className="hint" key={i}>
                  {s}
                </p>
              ))}
            </details>
          )}
          <div className="actions">
            <button
              className="ghost"
              disabled={busy}
              onClick={async () => {
                try {
                  setProposal(
                    await action("/ai/import-mapping", {
                      headers: Object.keys(batch.preview.rows[0] || {}),
                    }),
                  );
                } catch {
                  /* visible API error */
                }
              }}
            >
              Proponer mapeo con IA
            </button>
          </div>
          {proposal !== null && (
            <details open>
              <summary>Propuesta para revisión humana</summary>
              <pre>{JSON.stringify(proposal, null, 2)}</pre>
              <p className="hint">
                La propuesta no altera filas, fórmulas ni importes. La
                confirmación mantiene la validación determinista de esta
                previsualización.
              </p>
            </details>
          )}
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {Object.keys(batch.preview.rows[0] || {}).map((k) => (
                    <th key={k}>{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {batch.preview.rows.slice(0, 300).map((r, i) => (
                  <tr key={i}>
                    {Object.values(r).map((v, j) => (
                      <td key={j}>
                        {typeof v === "object" ? JSON.stringify(v) : String(v)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="hint">
            {batch.preview.notice} · Modalidad: {batch.preview.mode_hint} · SHA{" "}
            {batch.sha256}
          </p>
          <button
            disabled={
              busy ||
              !!batch.preview.errors.length ||
              batch.status !== "previsualizacion"
            }
            onClick={async () => {
              if (
                !window.confirm("Confirmar estas filas del original analizado?")
              )
                return;
              setBusy(true);
              try {
                const r = await action<{
                  import: ImportBatch;
                  result: { advances: Record<string, string>; mode: string };
                }>(`/imports/${batch.id}/confirm`, {
                  confirm: true,
                  sha256: batch.sha256,
                  contract,
                });
                setBatch(r.import);
                onAdvances?.(r.result.advances, r.result.mode);
                refresh();
              } catch {
                /* surfaced */
              } finally {
                setBusy(false);
              }
            }}
          >
            Confirmar importación
          </button>
        </>
      )}
    </Panel>
  );
}
