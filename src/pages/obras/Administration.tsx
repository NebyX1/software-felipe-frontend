import { useState } from "react";
import type { Json, Reference, Work } from "../../domain/types";
import { useApi, useAction } from "../../domain/hooks";
import { Panel, Field, Status } from "../../components/obras/UI";
import Imports from "../../components/obras/Imports";
const fields: Record<string, [string, string][]> = {
  companies: [
    ["name", "Nombre"],
    ["rut", "RUT"],
  ],
  professionals: [
    ["name", "Nombre"],
    ["registration", "Registro / CI"],
    ["source", "Fuente"],
  ],
  units: [
    ["name", "Unidad"],
    ["color", "Color"],
    ["emoji", "Identificador visual"],
  ],
  catalog: [
    ["code", "Código"],
    ["label", "Descripción"],
  ],
  users: [
    ["name", "Nombre"],
    ["email", "Email ficticio"],
    ["password", "Contraseña ficticia"],
  ],
};
export default function Administration() {
  const [kind, setKind] = useState("companies");
  const rows = useApi<{ items: Record<string, Json>[] }>(`/admin/${kind}`);
  const ref = useApi<Reference>("/reference");
  const [edit, setEdit] = useState<Record<string, Json> | null>(null);
  const run = useAction();
  const [error, setError] = useState("");
  const [workId, setWorkId] = useState("");
  const works = useApi<{ works: Work[] }>("/works?per_page=100");
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">CONFIGURACIÓN Y ACTORES</span>
          <h1>Administración</h1>
          <p>
            Entidades reutilizables, representantes y catálogos con fuentes
            verificables.
          </p>
        </div>
        <a className="button ghost" href="/admin/">
          Panel Flask
        </a>
      </div>
      <div className="tabs">
        {Object.entries({
          companies: "Empresas",
          professionals: "Profesionales",
          users: "Usuarios y representantes",
          units: "Unidades",
          catalog: "Catálogos y parámetros",
        }).map(([key, title]) => (
          <button
            className={kind === key ? "active" : ""}
            key={key}
            onClick={() => {
              setKind(key);
              setEdit(null);
            }}
          >
            {title}
          </button>
        ))}
      </div>
      <Panel title="Registros">
        <Status
          loading={rows.isLoading}
          error={rows.error}
          empty={!rows.data?.items.length}
        />
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre / descripción</th>
                <th>Identificador</th>
                <th>Estado / tipo</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.data?.items.map((r) => (
                <tr key={String(r.id)}>
                  <td>{String(r.id)}</td>
                  <td>{String(r.name || r.label || "")}</td>
                  <td>
                    {String(r.rut || r.registration || r.email || r.code || "")}
                  </td>
                  <td>{String(r.status || r.kind || r.role || "")}</td>
                  <td>
                    <button className="ghost small" onClick={() => setEdit(r)}>
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title={edit ? `Editar registro #${edit.id}` : "Crear registro"}>
        <form
          key={`${kind}-${edit?.id || "new"}`}
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            const form = new FormData(e.currentTarget);
            let contact: unknown, data: unknown;
            try {
              contact = JSON.parse(String(form.get("contact") || "{}"));
              data = JSON.parse(String(form.get("data") || "{}"));
            } catch {
              setError("El JSON de contacto o contexto no es válido.");
              return;
            }
            const payload = {
              ...Object.fromEntries(form),
              contact,
              data,
              unit_id: Number(form.get("unit_id")) || null,
              company_id: Number(form.get("company_id")) || null,
              is_active: form.has("is_active"),
              active: form.has("active"),
              demo: form.has("demo"),
            };
            if (
              await run(
                edit ? `/admin/${kind}/${edit.id}` : `/admin/${kind}`,
                payload,
                edit ? "patch" : "post",
              )
            )
              setEdit(null);
          }}
        >
          <div className="form-grid">
            {fields[kind]
              .filter(
                ([key]) =>
                  !edit ||
                  ![
                    "rut",
                    "registration",
                    "code",
                    "email",
                    "password",
                  ].includes(key),
              )
              .map(([key, caption]) => (
                <Field key={key} label={caption}>
                  <input
                    name={key}
                    defaultValue={String(edit?.[key] || "")}
                    type={
                      key === "password"
                        ? "password"
                        : key === "email"
                          ? "email"
                          : "text"
                    }
                    required={!["source", "color", "emoji"].includes(key)}
                  />
                </Field>
              ))}
            {kind === "companies" && edit && (
              <Field label="Estado de empresa">
                <select name="status" defaultValue={String(edit.status)}>
                  {["pendiente_validacion", "activa", "suspendida", "baja"].map(
                    (k) => (
                      <option key={k}>{k}</option>
                    ),
                  )}
                </select>
              </Field>
            )}
            {kind === "catalog" && (
              <>
                <Field label="Tipo de catálogo">
                  <select
                    name="kind"
                    disabled={!!edit}
                    defaultValue={String(edit?.kind || "rubro")}
                  >
                    {[
                      "objetivo",
                      "tipo",
                      "financiacion",
                      "unidad",
                      "rubro",
                      "precio",
                      "capa_geografica",
                      "parametro",
                    ].map((k) => (
                      <option key={k}>{k}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Contexto JSON (precios requieren source y date)">
                  <textarea
                    name="data"
                    rows={4}
                    defaultValue={JSON.stringify(edit?.data || {})}
                  />
                </Field>
                <label className="actions">
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={edit?.active !== false}
                  />
                  Entrada activa
                </label>
              </>
            )}
            {["companies", "professionals"].includes(kind) && (
              <Field label="Contactos privados JSON">
                <textarea
                  name="contact"
                  defaultValue={JSON.stringify(edit?.contact || {})}
                  rows={3}
                />
              </Field>
            )}
            {kind === "users" && (
              <>
                <Field label="Rol">
                  <select
                    name="role"
                    disabled={!!edit}
                    defaultValue={String(edit?.role || "tecnico")}
                  >
                    {[
                      "tecnico",
                      "director_obra",
                      "inspector",
                      "administrativo",
                      "consulta",
                      "empresa",
                      "direccion_general",
                    ].map((k) => (
                      <option key={k}>{k}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Unidad">
                  <select
                    name="unit_id"
                    defaultValue={String(edit?.unit_id || "")}
                  >
                    <option value="">Sin unidad</option>
                    {ref.data?.units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Empresa del representante">
                  <select
                    name="company_id"
                    defaultValue={String(edit?.company_id || "")}
                  >
                    <option value="">Sin empresa</option>
                    {ref.data?.companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <label className="actions">
                  <input
                    type="checkbox"
                    name="is_active"
                    defaultChecked={edit?.is_active !== false}
                  />
                  Cuenta activa
                </label>
                {!edit && (
                  <label className="actions">
                    <input type="checkbox" name="demo" defaultChecked />
                    Cuenta sintética para login demo
                  </label>
                )}
              </>
            )}
          </div>
          {error && <p className="error">{error}</p>}
          <div className="actions">
            <button>Guardar registro</button>
            {edit && (
              <button
                className="ghost"
                type="button"
                onClick={() => setEdit(null)}
              >
                Cancelar edición
              </button>
            )}
          </div>
        </form>
      </Panel>
      {kind === "professionals" && (
        <>
          <Panel title="Importación privada del padrón profesional">
            <Field label="Intervención de referencia para conservar el original">
              <select
                value={workId}
                onChange={(e) => setWorkId(e.target.value)}
              >
                <option value="">Seleccionar intervención</option>
                {works.data?.works.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </Field>
          </Panel>
          {workId && <Imports workId={Number(workId)} professional />}
        </>
      )}
      <Audit />
    </>
  );
}
function Audit() {
  const events = useApi<{
    events: Record<string, Json>[];
    auth_events: Record<string, Json>[];
  }>("/admin/audit/events");
  return (
    <Panel title="Auditoría de administración y acceso">
      <details>
        <summary>Consultar eventos recientes</summary>
        <Status error={events.error} />
        <pre>{JSON.stringify(events.data, null, 2)}</pre>
      </details>
    </Panel>
  );
}
