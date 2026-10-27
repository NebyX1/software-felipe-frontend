import { useEffect, useRef, useState } from "react";
import { getDocument, GlobalWorkerOptions, type RenderTask } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
GlobalWorkerOptions.workerSrc = workerUrl;
export default function PdfPage({
  url,
  page,
  onReady,
}: {
  url: string;
  page: number;
  onReady: (ready: boolean) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let rendering: RenderTask | undefined;
    let active = true;
    setError("");
    setLoading(true);
    onReady(false);
    const task = getDocument({ url });
    task.promise
      .then(async (pdf) => {
        const p = await pdf.getPage(page);
        if (!active || !canvas.current) return;
        const viewport = p.getViewport({ scale: 1.6 });
        canvas.current.width = viewport.width;
        canvas.current.height = viewport.height;
        rendering = p.render({ canvas: canvas.current, viewport });
        await rendering.promise;
        if (active) {
          setLoading(false);
          onReady(true);
        }
      })
      .catch((e) => {
        if (active && e.name !== "RenderingCancelledException") {
          setLoading(false);
          setError(
            "No se pudo mostrar esta página. Descargá el original para revisarla.",
          );
        }
      });
    return () => {
      active = false;
      rendering?.cancel();
      void task.destroy();
    };
  }, [url, page, onReady]);
  return (
    <>
      {error && <p className="error">{error}</p>}
      {loading && <p role="status">Cargando página del PDF…</p>}
      <canvas
        ref={canvas}
        style={{
          display: loading || error ? "none" : "block",
          width: "100%",
          height: "auto",
        }}
        role="img"
        aria-label={`Página ${page} del documento PDF`}
      />
    </>
  );
}
