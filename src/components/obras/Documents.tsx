import { useEffect, useState } from "react";
import PdfPage from "./PdfPage";
import { FiDownload, FiEye, FiUpload } from "react-icons/fi";
import type { Doc, Note } from "../../domain/types";
import { useApi, useAction, useRefresh } from "../../domain/hooks";
import { api, action, download } from "../../domain/api";
import { useSession, has, editors } from "../../domain/session";
import { Badge, Confirm, Field, Panel, Status } from "./UI";
export function useDocumentUrl(id: number | null | undefined) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let active = true;
    let objectUrl = "";
    setUrl("");
    if (id)
      api
        .get(`/documents/${id}/download?inline=1`, { responseType: "blob" })
        .then((r) => {
          objectUrl = URL.createObjectURL(r.data);
          if (active) setUrl(objectUrl);
        })
        .catch(() => {});
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);
  return url;
}
export function DocImage({
  id,
  alt,
  className,
}: {
  id: number;
  alt: string;
  className?: string;
}) {
  const url = useDocumentUrl(id);
  return url ? (
    <img src={url} alt={alt} className={className} />
  ) : (
    <span className="empty">Imagen…</span>
  );
}
export function Evidence({
  documents,
  name = "document_ids",
}: {
  documents: Doc[];
  name?: string;
}) {
  return (
    <fieldset className="field">
      <legend>Adjuntos / evidencia</legend>
      <div className="actions">
        {documents
          .filter((d) => d.status !== "sustituido")
          .map((d) => (
            <label key={d.id} className="actions">
              <input type="checkbox" name={name} value={d.id} />
              <span>
                {d.name} · v{d.version}
              </span>
            </label>
          ))}
      </div>
    </fieldset>
  );
}
export function formIds(form: FormData, name = "document_ids") {
  return form.getAll(name).map(Number);
}
export default function Documents({ workId }: { workId: number }) {
  const docs = useApi<{ documents: Doc[] }>(`/works/${workId}/documents`);
  const [viewer, setViewer] = useState<Doc | null>(null);
  const [previous, setPrevious] = useState<Doc | null>(null);
  const [busy, setBusy] = useState(false);
  const run = useAction();
  const refresh = useRefresh();
  const role = useSession((s) => s.user?.role);
  return (
    <>
      <Panel
        title="Documentos y versiones"
        actions={
          <span className="demo-tag">MinIO privado · Integridad SHA-256</span>
        }
      >
        <Status
          loading={docs.isLoading}
          error={docs.error}
          empty={!docs.data?.documents.length}
        />
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Documento</th>
                <th>Tipo / etapa</th>
                <th>Acceso / estado</th>
                <th>Índice documental</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {docs.data?.documents.map((d) => (
                <tr key={d.id}>
                  <td>
                    <strong>{d.name}</strong>
                    <small>
                      Versión {d.version} · Autor #{d.author_id} ·{" "}
                      {d.created_at.slice(0, 10)}
                    </small>
                    <small>SHA {d.sha256.slice(0, 16)}…</small>
                  </td>
                  <td>
                    {d.kind}
                    <small>{d.stage}</small>
                  </td>
                  <td>
                    <Badge value={d.classification} />
                    <small>{d.status}</small>
                  </td>
                  <td>
                    <Badge value={d.ingestion} />
                    {d.ingestion_error && (
                      <small className="error">{d.ingestion_error}</small>
                    )}
                  </td>
                  <td>
                    <div className="actions">
                      <button
                        className="ghost small"
                        aria-label={`Ver ${d.name} v${d.version}`}
                        onClick={() => setViewer(d)}
                      >
                        <FiEye />
                        Ver
                      </button>
                      <button
                        className="ghost small"
                        onClick={() =>
                          download(`/documents/${d.id}/download`, d.name)
                        }
                      >
                        <FiDownload />
                      </button>
                      {has([
                        ...editors,
                        "empresa",
                        "inspector",
                        "administrativo",
                      ]) &&
                        d.status !== "sustituido" && (
                          <>
                            <button
                              className="ghost small"
                              onClick={() => setPrevious(d)}
                            >
                              Nueva versión
                            </button>
                            <button
                              className="ghost small"
                              onClick={() => run(`/documents/${d.id}/ingest`)}
                            >
                              Indexar / reindexar
                            </button>
                            <button
                              className="ghost small"
                              onClick={() =>
                                run(`/documents/${d.id}/index`, {}, "delete")
                              }
                            >
                              Retirar índice
                            </button>
                            {has([...editors, "empresa"]) && (
                              <Confirm
                                text={`Retirar ${d.name}? Se conservará el archivo original para trazabilidad.`}
                                onConfirm={() =>
                                  run(`/documents/${d.id}`, {}, "delete")
                                }
                              />
                            )}
                          </>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      {has([...editors, "empresa", "inspector", "administrativo"]) && (
        <Panel
          title={
            previous ? `Nueva versión de ${previous.name}` : "Cargar documento"
          }
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const element = e.currentTarget;
              const form = new FormData(element);
              if (previous) form.set("previous_id", String(previous.id));
              setBusy(true);
              try {
                await action(`/works/${workId}/documents`, form);
                element.reset();
                setPrevious(null);
                refresh();
              } catch {
                /* API reports */
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="form-grid">
              <Field label="Archivo (PDF, imagen, XLSX, ODS, TXT · hasta 20 MB)">
                <input
                  name="file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.xlsx,.ods,.txt"
                  required
                />
              </Field>
              <Field label="Tipo">
                <select name="kind" defaultValue={previous?.kind || "plano"}>
                  {[
                    "plano",
                    "plano_final",
                    "foto",
                    "portada",
                    "acta_inicio",
                    "contrato",
                    "pliego",
                    "anexo",
                    "factura",
                    "manual_mantenimiento",
                    "acta_recepcion",
                    "informe",
                    "resolucion",
                    "comprobante",
                    "documento",
                  ].map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </Field>
              <Field label="Clasificación">
                <select
                  name="classification"
                  defaultValue={role === "empresa" ? "reservado" : "interno"}
                  disabled={role === "empresa"}
                >
                  {[
                    "interno",
                    "reservado",
                    ...(has([
                      "super_admin",
                      "admin",
                      "direccion_general",
                      "director_obra",
                    ])
                      ? ["publico"]
                      : []),
                    ...(has(["super_admin", "admin", "direccion_general"])
                      ? ["confidencial"]
                      : []),
                  ].map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="actions">
              <button disabled={busy}>
                <FiUpload />
                {busy ? "Guardando…" : "Subir archivo"}
              </button>
              {previous && (
                <button
                  type="button"
                  className="ghost"
                  onClick={() => setPrevious(null)}
                >
                  Cancelar versión
                </button>
              )}
            </div>
          </form>
        </Panel>
      )}
      <Panel title="Registro fotográfico">
        <div className="document-grid">
          {docs.data?.documents
            .filter(
              (d) => d.mime.startsWith("image/") && d.status !== "sustituido",
            )
            .map((d) => (
              <article key={d.id} className="record-card">
                <DocImage id={d.id} alt={d.name} />
                <h3>{d.name}</h3>
                <small>
                  {d.created_at.slice(0, 10)} · Autor #{d.author_id} · v
                  {d.version}
                </small>
                <button className="ghost small" onClick={() => setViewer(d)}>
                  Ampliar y anotar
                </button>
              </article>
            ))}
        </div>
      </Panel>
      {viewer && (
        <DocumentViewer
          key={viewer.id}
          document={viewer}
          onClose={() => setViewer(null)}
        />
      )}
    </>
  );
}
function DocumentViewer({
  document: doc,
  onClose,
}: {
  document: Doc;
  onClose: () => void;
}) {
  const url = useDocumentUrl(doc.id);
  const notes = useApi<{ annotations: Note[] }>(
    `/documents/${doc.id}/annotations`,
  );
  const [page, setPage] = useState(1);
  const [annotating, setAnnotating] = useState(false);
  const [viewerReady, setViewerReady] = useState(false);
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);
  const [text, setText] = useState("");
  const run = useAction();
  return (
    <Panel
      title={`${doc.name} · versión ${doc.version}`}
      actions={
        <button className="ghost" onClick={onClose}>
          Cerrar visor
        </button>
      }
    >
      <div className="actions">
        <Field label="Página">
          <input
            type="number"
            min={1}
            max={doc.pages || 1}
            value={page}
            onChange={(e) => {
              setPage(Number(e.target.value));
              setViewerReady(false);
              setPoint(null);
            }}
          />
        </Field>
        {has([...editors, "inspector"]) && (
          <button
            className="ghost"
            disabled={!viewerReady}
            onClick={() => setAnnotating(!annotating)}
          >
            {annotating ? "Terminar anotación" : "Anotar posición"}
          </button>
        )}
      </div>
      {annotating && (
        <p className="hint">
          Ubicá la página indicada en el visor y seleccioná una posición. La
          nota queda vinculada a esta versión y página.
        </p>
      )}
      <div
        className="viewer"
        style={{ height: "auto", minHeight: viewerReady ? 0 : 200 }}
        onClick={(e) => {
          if (annotating && viewerReady) {
            const rect = e.currentTarget.getBoundingClientRect();
            setPoint({
              x: (e.clientX - rect.left) / rect.width,
              y: (e.clientY - rect.top) / rect.height,
            });
          }
        }}
      >
        {url &&
          (doc.mime.startsWith("image/") ? (
            <img
              src={url}
              alt={doc.name}
              onLoad={() => setViewerReady(true)}
              style={{ width: "100%", height: "auto" }}
            />
          ) : doc.mime === "application/pdf" ? (
            <PdfPage url={url} page={page} onReady={setViewerReady} />
          ) : (
            <p className="empty">
              Descargá este formato para abrirlo con su aplicación.
            </p>
          ))}
        {notes.data?.annotations
          .filter((n) => n.page === page)
          .map((n, i) => (
            <span
              className="annotation-dot"
              title={n.text}
              key={n.id}
              style={{
                left: `${Number(n.x) * 100}%`,
                top: `${Number(n.y) * 100}%`,
              }}
            >
              {i + 1}
            </span>
          ))}
        {point && (
          <span
            className="annotation-dot"
            style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
          >
            +
          </span>
        )}
      </div>
      {point && (
        <form
          className="actions"
          onSubmit={async (e) => {
            e.preventDefault();
            if (
              await run(`/documents/${doc.id}/annotations`, {
                page,
                x: String(point.x),
                y: String(point.y),
                text,
              })
            ) {
              setPoint(null);
              setText("");
            }
          }}
        >
          <Field label="Texto de la anotación">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
            />
          </Field>
          <button>Guardar anotación</button>
        </form>
      )}
      {has([
        "super_admin",
        "admin",
        "direccion_general",
        "director_obra",
        "inspector",
      ]) &&
        ["cargado", "observado", "validado"].includes(doc.status) && (
          <form
            style={{ marginTop: 18 }}
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              if (
                await run(`/documents/${doc.id}/transition`, {
                  status: f.get("status"),
                  comment: f.get("comment"),
                })
              )
                onClose();
            }}
          >
            <div className="form-grid two">
              <Field label="Revisión documental">
                <select name="status">
                  {(doc.status === "validado"
                    ? ["archivado"]
                    : doc.status === "observado"
                      ? ["validado"]
                      : ["validado", "observado"]
                  ).map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </Field>
              <Field label="Comentario de revisión">
                <textarea name="comment" required />
              </Field>
            </div>
            <button>Registrar revisión documental</button>
          </form>
        )}
      <div className="record-list">
        {notes.data?.annotations.map((n) => (
          <div className="comment" key={n.id}>
            <small>
              Página {n.page} · Autor #{n.author_id} · posición ({n.x}, {n.y})
            </small>
            <p>{n.text}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}
