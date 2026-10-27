import { useState } from "react";
import { useApi, useAction, useRefresh } from "../../domain/hooks";
import { has, useSession } from "../../domain/session";
import { api, download, errorText } from "../../domain/api";
import toast from "react-hot-toast";
import { Panel, Field, Badge, Status } from "../../components/obras/UI";
interface Company {
  id: number;
  name: string;
  rut: string;
  status: string;
  demo: boolean;
  contact: Record<string, string>;
}
interface CompanyDoc {
  id: number;
  name: string;
  kind: string;
  version: number;
  status: string;
  sha256: string;
}
interface Representative {
  user_id: number;
  name: string;
  status: string;
  start_date: string;
  end_date: string | null;
  evidence_id: number | null;
}
function Profile({ id }: { id: number }) {
  const url = `/companies/${id}`;
  const data = useApi<{
    company: Company;
    documents: CompanyDoc[];
    representatives: Representative[];
  }>(`${url}/profile`);
  const refresh = useRefresh();
  const run = useAction();
  const [busy, setBusy] = useState(false);
  if (!data.data) return <Status loading={data.isLoading} error={data.error} />;
  const { company, representatives, documents } = data.data;
  return (
    <>
      <Panel title={company.name} actions={<Badge value={company.status} />}>
        <p>
          Registro: {company.rut} ·{" "}
          {company.demo
            ? "Empresa ficticia de demostración"
            : "Registro empresarial"}
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            await run(
              `${url}/profile`,
              { contact: Object.fromEntries(f) },
              "patch",
            );
          }}
        >
          <div className="form-grid">
            {[
              ["contact_name", "Contacto"],
              ["email", "Correo"],
              ["phone", "Teléfono"],
              ["address", "Dirección"],
            ].map(([key, label]) => (
              <Field label={label} key={key}>
                <input
                  name={key}
                  type={key === "email" ? "email" : "text"}
                  defaultValue={company.contact[key] || ""}
                  maxLength={250}
                />
              </Field>
            ))}
          </div>
          <button>Guardar contacto de empresa</button>
        </form>
      </Panel>
      <Panel title="Documentación privada de empresa">
        <p className="hint">
          Registro, representación y constancias. Las versiones y hashes se
          conservan en almacenamiento privado.
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            setBusy(true);
            try {
              await api.post(`${url}/documents`, new FormData(form));
              toast.success("Documento de empresa registrado");
              await refresh();
              form.reset();
            } catch (error) {
              toast.error(errorText(error));
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="form-grid">
            <Field label="Tipo de documento de empresa">
              <select name="kind">
                <option value="representacion">
                  Evidencia de representación
                </option>
                <option value="registro">Registro empresarial</option>
                <option value="bps">Constancia BPS</option>
                <option value="dgi">Constancia DGI</option>
                <option value="otro">Otro documento</option>
              </select>
            </Field>
            <Field label="Archivo privado">
              <input
                type="file"
                name="file"
                required
                accept=".pdf,.png,.jpg,.jpeg,.txt,.xlsx,.ods"
              />
            </Field>
            <Field label="Nueva versión de">
              <select name="previous_id">
                <option value="">Documento nuevo</option>
                {documents
                  .filter((d) => d.status !== "sustituido")
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} · v{d.version}
                    </option>
                  ))}
              </select>
            </Field>
          </div>
          <button disabled={busy}>Cargar documento de empresa</button>
        </form>
        {documents.map((d) => (
          <div key={d.id} className="notice">
            <div>
              <strong>{d.name}</strong>
              <small>
                {d.kind} · v{d.version} · {d.status}
              </small>
              <small className="hash">SHA-256: {d.sha256}</small>
            </div>
            <button
              className="ghost"
              onClick={() =>
                download(`${url}/documents/${d.id}/download`, d.name)
              }
            >
              Descargar
            </button>
          </div>
        ))}
      </Panel>
      <Panel title="Representantes y vigencia">
        <p className="hint">
          El acceso a obras requiere representación validada y fechas vigentes.
          Las identidades de esta demo son ficticias.
        </p>
        {representatives.map((r) => (
          <article key={r.user_id} className="record-card">
            <div className="section-heading">
              <h3>{r.name}</h3>
              <Badge value={r.status} />
            </div>
            <p>
              Desde {r.start_date} hasta{" "}
              {r.end_date || "Sin fecha de finalización"}
            </p>
            {has(["super_admin", "admin", "direccion_general"]) && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  await run(`${url}/representatives/${r.user_id}`, {
                    ...Object.fromEntries(f),
                    evidence_id: Number(f.get("evidence_id")) || undefined,
                  });
                }}
              >
                <div className="form-grid">
                  <Field label={`Estado de representación de ${r.name}`}>
                    <select name="status" defaultValue={r.status}>
                      <option value="pendiente">Pendiente</option>
                      <option value="validada">Validada</option>
                      <option value="revocada">Revocada</option>
                    </select>
                  </Field>
                  <Field label="Vigencia desde">
                    <input
                      name="start_date"
                      type="date"
                      required
                      defaultValue={r.start_date}
                    />
                  </Field>
                  <Field label="Vigencia hasta">
                    <input
                      name="end_date"
                      type="date"
                      defaultValue={r.end_date || ""}
                    />
                  </Field>
                  <Field label="Evidencia de representación">
                    <select
                      name="evidence_id"
                      defaultValue={r.evidence_id || ""}
                    >
                      <option value="">Elegir evidencia</option>
                      {documents
                        .filter(
                          (d) =>
                            d.kind === "representacion" &&
                            d.status !== "sustituido",
                        )
                        .map((d) => (
                          <option value={d.id} key={d.id}>
                            {d.name} · v{d.version}
                          </option>
                        ))}
                    </select>
                  </Field>
                </div>
                <button>Registrar validación de representante</button>
              </form>
            )}
          </article>
        ))}
      </Panel>
    </>
  );
}
export default function Companies() {
  const user = useSession((s) => s.user);
  const own = user?.role === "empresa";
  const data = useApi<{ companies: Company[] }>("/reference");
  const [selected, setSelected] = useState("");
  const id = own
    ? user?.company_id
    : Number(selected || data.data?.companies[0]?.id);
  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">REGISTRO Y REPRESENTACIÓN</div>
          <h1>{own ? "Mi empresa" : "Empresas"}</h1>
          <p>Perfil, documentación y representantes autorizados.</p>
        </div>
      </div>
      {!own && (
        <Field label="Empresa a consultar">
          <select
            value={selected || String(id || "")}
            onChange={(e) => setSelected(e.target.value)}
          >
            {data.data?.companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Status loading={data.isLoading} error={data.error} />
      {id && <Profile key={id} id={id} />}
    </>
  );
}
