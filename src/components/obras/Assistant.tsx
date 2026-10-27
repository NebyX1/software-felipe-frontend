import { useState } from "react";
import type { Source, Turn } from "../../domain/types";
import { useApi, useRefresh } from "../../domain/hooks";
import { useSession } from "../../domain/session";
import { download, errorText } from "../../domain/api";
import { Panel, Field, Status, Badge } from "./UI";
export default function Assistant({ workId }: { workId: number }) {
  const history = useApi<{ turns: Turn[] }>(`/works/${workId}/chat`);
  const availability = useApi<{ assistant_available?: boolean }>(
    "/demo/scenarios",
  );
  const aiDisabled = availability.data?.assistant_available === false;
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [partial, setPartial] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [error, setError] = useState("");
  const refresh = useRefresh();
  const results = useApi<{ sources: Source[] }>(
    `/works/${workId}/search?q=${encodeURIComponent(search)}`,
    !!search,
  );
  async function chat() {
    setBusy(true);
    setError("");
    setPartial("");
    setSources([]);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "/api"}/works/${workId}/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${useSession.getState().token}`,
          },
          body: JSON.stringify({ query }),
        },
      );
      if (!response.ok) {
        const result = await response.json();
        throw new Error(
          result.message ||
            result.error ||
            "No hay fuentes o la consulta no está disponible.",
        );
      }
      const reader = response.body?.getReader();
      if (!reader) throw new Error("El navegador no admite streaming.");
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const result = await reader.read();
        buffer += decoder.decode(result.value, { stream: !result.done });
        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() || "";
        for (const block of blocks) {
          const event = block
            .split("\n")
            .find((l) => l.startsWith("event:"))
            ?.slice(6)
            .trim();
          const payload = JSON.parse(
            block
              .split("\n")
              .filter((l) => l.startsWith("data:"))
              .map((l) => l.slice(5).trim())
              .join("\n") || "{}",
          );
          if (event === "context") setSources(payload.sources);
          if (event === "token") setPartial((v) => v + payload.text);
          if (event === "error") {
            setError(payload.message);
            setPartial("");
          }
          if (event === "done") {
            setPartial("");
            setSources([]);
            await refresh();
          }
        }
        if (result.done) break;
      }
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
      refresh();
    }
  }
  return (
    <Panel title="Asistencia documental con fuentes">
      <p className="hint">
        Consultas sobre documentos vigentes de esta obra, filtrados por permisos
        antes de recuperar contenido. La IA no calcula ni aprueba
        certificaciones. Indexá los documentos desde su pestaña.
      </p>
      {aiDisabled && (
        <p className="hint" role="status">
          Las respuestas con IA no están habilitadas en esta instalación. Podés
          indexar documentos y buscar fragmentos sin IA.
        </p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          chat();
        }}
      >
        <Field label="Consulta documental">
          <textarea
            rows={3}
            maxLength={3000}
            required
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="¿Qué indica el informe sobre el mantenimiento de canaletas?"
          />
        </Field>
        <div className="actions">
          <button disabled={busy || aiDisabled}>
            {busy ? "Consultando proveedor cloud…" : "Consultar con IA"}
          </button>
          <button
            type="button"
            className="ghost"
            disabled={!query}
            onClick={() => setSearch(query)}
          >
            Buscar fragmentos sin IA
          </button>
        </div>
      </form>
      {error && (
        <p role="alert" className="error" style={{ marginTop: 18 }}>
          {error}
        </p>
      )}
      {busy && (
        <div className="chat-turn">
          <Badge value="procesando" />
          <p aria-live="polite">
            {partial || "Esperando respuesta del proveedor…"}
          </p>
          <Sources sources={sources} />
        </div>
      )}
      {search && (
        <>
          <h3 style={{ marginTop: 22 }}>Fragmentos recuperados</h3>
          <Status
            loading={results.isLoading}
            error={results.error}
            empty={!results.data?.sources.length}
          />
          {results.data?.sources.map((s) => (
            <div className="comment" key={s.id}>
              <small>
                {s.name} · v{s.version} · página {s.page}
              </small>
              <p>{s.text}</p>
              <Sources sources={[s]} />
            </div>
          ))}
        </>
      )}
      <Status loading={history.isLoading} error={history.error} />
      {history.data?.turns.map((t) => (
        <div className="chat-turn" key={t.id}>
          <strong>{t.query}</strong>
          <Badge value={t.status} />
          <p>{t.answer || t.error_code || "Consulta pendiente"}</p>
          <Sources sources={t.sources} />
        </div>
      ))}
    </Panel>
  );
}
function Sources({ sources }: { sources: Source[] }) {
  return (
    <div className="source-list">
      {sources.map((s) => (
        <button
          className="ghost small"
          key={s.id}
          onClick={() =>
            download(`/documents/${s.document_id}/download`, s.name)
          }
        >
          Fuente #{s.id}: {s.name} · v{s.version} · p{s.page}
        </button>
      ))}
    </div>
  );
}
