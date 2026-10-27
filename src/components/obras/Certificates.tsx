import { useState } from "react";
import PaymentSimulator from "./PaymentSimulator";
import type { Calc, Cert, Contract, Doc, Payment } from "../../domain/types";
import { useApi, useAction, useRefresh } from "../../domain/hooks";
import { action, download } from "../../domain/api";
import { has, directors, generals, useSession } from "../../domain/session";
import { Badge, Field, Panel, Status, DecimalInput, currency } from "./UI";
import { Evidence, formIds } from "./Documents";
import Imports from "./Imports";
const certSteps = [
  "borrador",
  "presentado",
  "aprobacion_inicial",
  "facturado",
  "aprobado",
];
export default function Certificates({
  workId,
  stage,
}: {
  workId: number;
  stage: string;
}) {
  const certs = useApi<{ certificates: Cert[] }>(
    `/works/${workId}/certificates`,
  );
  const contracts = useApi<{ contracts: Contract[] }>(
    `/works/${workId}/contracts`,
  );
  const docs = useApi<{ documents: Doc[] }>(`/works/${workId}/documents`);
  const payments = useApi<{ payments: Payment[] }>(`/works/${workId}/payments`);
  const [editing, setEditing] = useState<Cert | null | undefined>(undefined);
  const [history, setHistory] = useState<number | null>(null);
  const [correction, setCorrection] = useState<Cert | null>(null);
  const role = useSession((s) => s.user?.role);
  const run = useAction();
  const contract = contracts.data?.contracts.find(
    (c) => c.kind === "contractual" && c.status === "aprobado",
  );
  return (
    <>
      <Panel
        title="Certificaciones mensuales"
        actions={
          role === "empresa" &&
          stage === "obra" &&
          contract && (
            <button onClick={() => setEditing(null)}>
              Iniciar certificación
            </button>
          )
        }
      >
        <p className="hint">
          El avance físico y los importes certificados cambian al aprobar
          definitivamente. Los pagos se actualizan cuando finaliza el circuito
          administrativo.
        </p>
        <Status
          loading={certs.isLoading}
          error={certs.error}
          empty={!certs.data?.certificates.length}
        />
        {certs.data?.certificates.map((c) => (
          <article
            className="record-card"
            key={c.id}
            style={{ marginBottom: 18 }}
          >
            <div className="section-heading">
              <h3>
                Período {c.period} · Revisión {c.revision}
              </h3>
              <Badge value={c.status} />
            </div>
            <small>
              {c.start_date} a {c.end_date} · Modalidad {c.mode} · Factura{" "}
              {c.invoice_number || "pendiente"}
            </small>
            <div className="step-track">
              {certSteps.map((s) => (
                <span key={s} className={c.status === s ? "current" : ""}>
                  {s.replaceAll("_", " ")}
                </span>
              ))}
            </div>
            <Calculation calculation={c.calculation} />
            <div className="actions">
              {role === "empresa" &&
                ["borrador", "observado"].includes(c.status) && (
                  <>
                    <button className="ghost" onClick={() => setEditing(c)}>
                      Editar / subsanar
                    </button>
                    <button
                      disabled={editing?.id === c.id}
                      onClick={() =>
                        run(
                          `/works/${workId}/certificates/${c.id}/transition`,
                          { status: "presentado", version: c.version },
                        )
                      }
                    >
                      Presentar avance
                    </button>
                  </>
                )}
              {c.status === "presentado" && has(directors) && (
                <button
                  onClick={() =>
                    run(`/works/${workId}/certificates/${c.id}/transition`, {
                      status: "aprobacion_inicial",
                      version: c.version,
                    })
                  }
                >
                  Aprobar inicialmente
                </button>
              )}
              {c.status === "facturado" && has(generals) && (
                <button
                  onClick={() =>
                    run(`/works/${workId}/certificates/${c.id}/transition`, {
                      status: "aprobado",
                      version: c.version,
                    })
                  }
                >
                  Aprobar definitivamente
                </button>
              )}
              <button
                className="ghost"
                onClick={() => setHistory(history === c.id ? null : c.id)}
              >
                Ver revisiones
              </button>
              {c.certificate_document_id && (
                <button
                  className="ghost"
                  onClick={() =>
                    download(
                      `/documents/${c.certificate_document_id}/download`,
                      `certificado-${c.period}.pdf`,
                    )
                  }
                >
                  Certificación PDF
                </button>
              )}
              {c.payment_document_id && (
                <button
                  className="ghost"
                  onClick={() =>
                    download(
                      `/documents/${c.payment_document_id}/download`,
                      `nota-pago-${c.period}.pdf`,
                    )
                  }
                >
                  Nota de pago PDF
                </button>
              )}
              {c.status === "aprobado" && has(directors) && (
                <>
                  <button className="ghost" onClick={() => setCorrection(c)}>
                    Rectificación explícita
                  </button>
                  {!c.certificate_document_id && (
                    <button
                      onClick={() =>
                        run(`/works/${workId}/certificates/${c.id}/pdf/retry`)
                      }
                    >
                      Regenerar PDF pendiente
                    </button>
                  )}
                </>
              )}
            </div>
            {((c.status === "presentado" && has(directors)) ||
              (c.status === "facturado" && has(generals))) && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = new FormData(e.currentTarget);
                  await run(
                    `/works/${workId}/certificates/${c.id}/transition`,
                    {
                      version: c.version,
                      status: "observado",
                      comment: form.get("comment"),
                    },
                  );
                }}
              >
                <Field label="Devolver con observación">
                  <textarea name="comment" required />
                </Field>
                <button className="ghost">Registrar observación</button>
              </form>
            )}
            {c.status === "aprobacion_inicial" && role === "empresa" && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = new FormData(e.currentTarget);
                  await run(
                    `/works/${workId}/certificates/${c.id}/transition`,
                    {
                      version: c.version,
                      status: "facturado",
                      invoice_id: Number(form.get("invoice_id")),
                      invoice_number: form.get("invoice_number"),
                    },
                  );
                }}
              >
                <p className="hint">
                  Subí la factura PDF en Documentos con tipo «factura» y
                  vinculala aquí.
                </p>
                <div className="form-grid two">
                  <Field label="Factura PDF">
                    <select name="invoice_id" required>
                      <option value="">Seleccionar factura</option>
                      {docs.data?.documents
                        .filter(
                          (d) =>
                            d.kind === "factura" &&
                            d.mime === "application/pdf" &&
                            d.status !== "sustituido",
                        )
                        .map((d) => (
                          <option value={d.id} key={d.id}>
                            {d.name} · v{d.version}
                          </option>
                        ))}
                    </select>
                  </Field>
                  <Field label="Número de factura">
                    <input name="invoice_number" required />
                  </Field>
                </div>
                <button>Vincular factura y enviar a Dirección General</button>
              </form>
            )}
            {history === c.id && <Revisions workId={workId} certId={c.id} />}
            <Corrections workId={workId} certId={c.id} />
            {c.approved_snapshot && (
              <details>
                <summary>Instantánea de aprobación inmutable</summary>
                <pre>{JSON.stringify(c.approved_snapshot, null, 2)}</pre>
              </details>
            )}
          </article>
        ))}
      </Panel>
      {editing !== undefined && contract && (
        <CertificateForm
          workId={workId}
          contract={contract}
          cert={editing}
          onClose={() => setEditing(undefined)}
        />
      )}
      <Panel title="Expedientes y pagos ficticios">
        <Status
          error={payments.error}
          empty={!payments.data?.payments.length}
        />
        {payments.data?.payments.map((p) => (
          <PaymentForm
            key={p.id}
            workId={workId}
            payment={p}
            docs={docs.data?.documents || []}
          />
        ))}
      </Panel>
      {correction && (
        <CorrectionForm
          cert={correction}
          workId={workId}
          onClose={() => setCorrection(null)}
        />
      )}
    </>
  );
}
function CertificateForm({
  workId,
  contract,
  cert,
  onClose,
}: {
  workId: number;
  contract: Contract;
  cert: Cert | null;
  onClose: () => void;
}) {
  const [mode, setMode] = useState(cert?.mode || "periodo");
  const [period, setPeriod] = useState(
    cert?.period || new Date().toISOString().slice(0, 7),
  );
  const [inputs, setInputs] = useState<Record<string, string>>(
    cert?.input.advances || {},
  );
  const [icc, setIcc] = useState(cert?.input.icc_current || "");
  const [calc, setCalc] = useState<Calc | null>(null);
  const [busy, setBusy] = useState(false);
  const [key] = useState(crypto.randomUUID());
  const refresh = useRefresh();
  const payload = { mode, advances: inputs, icc_current: icc || undefined };
  const preview = async () => {
    setBusy(true);
    try {
      const r = await action<{ calculation: Calc }>(
        `/works/${workId}/certificates/preview`,
        payload,
      );
      setCalc(r.calculation);
    } catch {
      setCalc(null);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Panel title={cert ? "Subsanar certificación" : "Cargar avance mensual"}>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              const form = new FormData(e.currentTarget);
              await action(
                cert
                  ? `/works/${workId}/certificates/${cert.id}`
                  : `/works/${workId}/certificates`,
                {
                  ...payload,
                  period,
                  start_date: form.get("start_date"),
                  end_date: form.get("end_date"),
                  idempotency_key: key,
                  version: cert?.version,
                },
                cert ? "patch" : "post",
              );
              await refresh();
              onClose();
            } catch {
              /* API reports */
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="form-grid">
            <Field label="Período">
              <input
                type="month"
                value={period}
                required
                disabled={!!cert}
                onChange={(e) => setPeriod(e.target.value)}
              />
            </Field>
            <Field label="Modalidad">
              <select
                value={mode}
                onChange={(e) => {
                  setMode(e.target.value);
                  setInputs({});
                  setCalc(null);
                }}
              >
                <option value="periodo">
                  Porcentaje del período (se suma al anterior)
                </option>
                <option value="acumulado">
                  Porcentaje acumulado (se resta el anterior)
                </option>
                <option value="cantidad">
                  Cantidad ejecutada en el período
                </option>
                <option value="importe">Importe base del período (UYU)</option>
              </select>
            </Field>
            {contract.rules.icc_initial && (
              <Field
                label={`ICC del período · índice inicial ${contract.rules.icc_initial}`}
              >
                <DecimalInput
                  required
                  value={icc}
                  onChange={(e) => {
                    setIcc(e.target.value);
                    setCalc(null);
                  }}
                />
              </Field>
            )}
            <Field label="Fecha inicial (vacío = inicio de mes)">
              <input
                type="date"
                name="start_date"
                defaultValue={cert?.start_date}
              />
            </Field>
            <Field label="Fecha final (vacío = fin de mes)">
              <input
                type="date"
                name="end_date"
                defaultValue={cert?.end_date}
              />
            </Field>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Rubro</th>
                  <th>Unidad</th>
                  <th>Cantidad contractual</th>
                  <th>
                    {mode === "cantidad"
                      ? "Cantidad del período"
                      : mode === "importe"
                        ? "Importe base UYU"
                        : mode === "acumulado"
                          ? "% acumulado"
                          : "% del período"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {contract.lines.map((l) => (
                  <tr key={l.code}>
                    <td>{l.code}</td>
                    <td>{l.description}</td>
                    <td>{l.unit}</td>
                    <td>{l.quantity}</td>
                    <td>
                      <DecimalInput
                        aria-label={`Avance ${l.code}`}
                        value={inputs[l.code] || ""}
                        placeholder={
                          mode === "acumulado" ? "Anterior si vacío" : "0"
                        }
                        onChange={(e) => {
                          const next = { ...inputs };
                          if (e.target.value) next[l.code] = e.target.value;
                          else delete next[l.code];
                          setInputs(next);
                          setCalc(null);
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="actions" style={{ marginTop: 18 }}>
            <button
              type="button"
              className="ghost"
              disabled={busy}
              onClick={preview}
            >
              Calcular y verificar
            </button>
            <button disabled={!calc || busy}>
              {cert ? "Guardar subsanación" : "Guardar borrador"}
            </button>
            <button type="button" className="ghost" onClick={onClose}>
              Cancelar
            </button>
          </div>
          {calc && <Calculation calculation={calc} />}
        </form>
      </Panel>
      <Imports
        workId={workId}
        onAdvances={(values, nextMode) => {
          setInputs(values);
          setMode(nextMode);
          setCalc(null);
        }}
      />
    </>
  );
}
export function Calculation({ calculation: c }: { calculation: Calc }) {
  return (
    <>
      <div className="cert-summary">
        {[
          ["Base", c.base],
          ["IVA", c.iva],
          ["Leyes sociales", c.social],
          ["Ajuste ICC", c.adjustment],
          ["IVA del ajuste", c.adjustment_iva],
          ["Total a pagar", c.payable],
        ].map(([name, v]) => (
          <div key={name}>
            <small>{name}</small>
            <strong>{currency(v)}</strong>
          </div>
        ))}
      </div>
      <details>
        <summary>Ver cálculo por rubro, anteriores y acumulados</summary>
        <p className="hint">
          {c.rounding} · LLSS {c.social_payment} · ICC base {c.icc_base}
        </p>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Código / descripción</th>
                <th>% anterior</th>
                <th>% período</th>
                <th>% acumulado</th>
                <th>Importe UYU</th>
                <th>LLSS UYU</th>
              </tr>
            </thead>
            <tbody>
              {c.lines.map((l) => (
                <tr key={l.code}>
                  <td>
                    {l.code} · {l.description}
                  </td>
                  <td>{(Number(l.previous) * 100).toFixed(4)}</td>
                  <td>{(Number(l.period) * 100).toFixed(4)}</td>
                  <td>{(Number(l.accumulated) * 100).toFixed(4)}</td>
                  <td>{currency(l.amount)}</td>
                  <td>{currency(l.social)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}
function Revisions({ workId, certId }: { workId: number; certId: number }) {
  const rows = useApi<{
    revisions: {
      id: number;
      revision: number;
      snapshot: unknown;
      actor_id: number;
      created_at: string;
    }[];
  }>(`/works/${workId}/certificates/${certId}/revisions`);
  return (
    <div>
      {rows.data?.revisions.map((r) => (
        <details key={r.id}>
          <summary>
            Revisión {r.revision} · Usuario #{r.actor_id} · {r.created_at}
          </summary>
          <pre>{JSON.stringify(r.snapshot, null, 2)}</pre>
        </details>
      ))}
    </div>
  );
}
export function PaymentForm({
  workId,
  payment: p,
  docs,
}: {
  workId: number;
  payment: Payment;
  docs: Doc[];
}) {
  const run = useAction();
  const sequence = [
    "expediente",
    "hacienda",
    "secretaria_general",
    "resolucion",
    "contaduria_tesoreria",
    "pagado",
  ];
  const next = sequence[sequence.indexOf(p.status) + 1];
  const allowed =
    has(["super_admin", "admin", "administrativo", "direccion_general"]) &&
    (next !== "resolucion" || has(generals));
  return (
    <article className="record-card" style={{ marginBottom: 15 }}>
      <div className="section-heading">
        <h3>
          {p.reference} · Certificado #{p.certificate_id}
        </h3>
        <Badge value={p.status} />
      </div>
      <p>{currency(p.amount)} · Pago ficticio</p>
      <div className="step-track">
        {sequence.map((s) => (
          <span key={s} className={s === p.status ? "current" : ""}>
            {s.replaceAll("_", " ")}
          </span>
        ))}
      </div>
      {next && next !== "pagado" && allowed && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            await run(`/works/${workId}/payments/${p.id}/transition`, {
              version: p.version,
              status: next,
              comment: form.get("comment"),
              budget_available: form.has("budget_available"),
              confirm_demo: form.has("confirm_demo"),
              document_ids: formIds(form),
            });
          }}
        >
          <Field label={`Actuación para pase a ${next.replaceAll("_", " ")}`}>
            <textarea name="comment" required />
          </Field>
          {next === "hacienda" && (
            <label className="actions">
              <input type="checkbox" name="budget_available" required />
              Disponibilidad presupuestal verificada en demo
            </label>
          )}
          <Evidence documents={docs} />
          {next === "pagado" && (
            <label className="actions">
              <input type="checkbox" name="confirm_demo" required />
              Confirmo que este pago es ficticio y no mueve fondos
            </label>
          )}
          <button>Registrar pase a {next.replaceAll("_", " ")}</button>
        </form>
      )}
      <PaymentSimulator workId={workId} payment={p} />
      {p.confirmation && (
        <p className="hint">
          Pago ficticio confirmado · {String(p.confirmation.date || "")} ·{" "}
          {String(
            p.confirmation.transaction || "Registro manual de demostración",
          )}
        </p>
      )}
    </article>
  );
}
interface Correction {
  id: number;
  version: number;
  status: string;
  reason: string;
  snapshot: {
    delta: string;
    document_id?: number;
    after: { calculation: Calc };
  };
}
function Corrections({ workId, certId }: { workId: number; certId: number }) {
  const rows = useApi<{ rectifications: Correction[] }>(
    `/works/${workId}/certificates/${certId}/rectifications`,
  );
  const run = useAction();
  return (
    <>
      {rows.data?.rectifications.map((r) => (
        <div className="comment" key={r.id}>
          <Badge value={r.status} />
          <p>
            Rectificación #{r.id}: {r.reason} · Diferencia{" "}
            {currency(r.snapshot.delta)}
          </p>
          {r.snapshot.document_id && (
            <button
              className="ghost small"
              onClick={() =>
                download(
                  `/documents/${r.snapshot.document_id}/download`,
                  `rectificacion-${r.id}.pdf`,
                )
              }
            >
              Anexo de rectificación PDF
            </button>
          )}
          <details>
            <summary>Cálculo rectificado</summary>
            <Calculation calculation={r.snapshot.after.calculation} />
          </details>
          {r.status === "solicitada" && has(generals) && (
            <div className="actions">
              {["aprobada", "rechazada"].map((status) => (
                <button
                  className="ghost"
                  key={status}
                  onClick={() =>
                    run(
                      `/works/${workId}/certificates/${certId}/rectifications/${r.id}/resolve`,
                      { status, version: r.version },
                    )
                  }
                >
                  {status === "aprobada" ? "Aprobar rectificación" : "Rechazar"}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </>
  );
}
function CorrectionForm({
  workId,
  cert,
  onClose,
}: {
  workId: number;
  cert: Cert;
  onClose: () => void;
}) {
  const run = useAction();
  return (
    <Panel title={`Rectificar período ${cert.period}`}>
      <p className="hint">
        Se agrega una instantánea con la diferencia. El original permanece
        intacto. Resolvé antes del pase a Hacienda y de abrir el período
        siguiente.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          const advances = Object.fromEntries(
            cert.calculation.lines.map((l) => [
              l.code,
              String(form.get(l.code)),
            ]),
          );
          if (
            await run(
              `/works/${workId}/certificates/${cert.id}/rectifications`,
              {
                mode: "periodo",
                advances,
                icc_current: form.get("icc_current") || undefined,
                reason: form.get("reason"),
              },
            )
          )
            onClose();
        }}
      >
        <Field label="Motivo explícito">
          <textarea name="reason" required />
        </Field>
        <div className="form-grid">
          {cert.calculation.lines.map((l) => (
            <Field
              key={l.code}
              label={`${l.code} · porcentaje del período corregido`}
            >
              <DecimalInput
                name={l.code}
                required
                defaultValue={String(Number(l.period) * 100)}
              />
            </Field>
          ))}
        </div>
        {cert.calculation.icc_initial && (
          <Field label="ICC del período corregido">
            <DecimalInput
              name="icc_current"
              required
              defaultValue={cert.calculation.icc_current}
            />
          </Field>
        )}
        <div className="actions">
          <button>Solicitar rectificación</button>
          <button type="button" className="ghost" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </form>
    </Panel>
  );
}
