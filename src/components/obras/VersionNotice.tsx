import { useEffect, useState } from "react";
import { FiRefreshCw } from "react-icons/fi";

function release(doc: Document) {
  const entry = doc
    .querySelector('script[type="module"][src]')
    ?.getAttribute("src");
  const style = doc
    .querySelector('link[rel="stylesheet"][href]')
    ?.getAttribute("href");
  if (!entry) return null;
  return JSON.stringify(
    [entry, style].map((url) =>
      url ? new URL(url, window.location.href).href : null,
    ),
  );
}

export default function VersionNotice() {
  const [outdated, setOutdated] = useState(false);
  useEffect(() => {
    const current = release(document);
    let disposed = false;
    let checking = false;
    const requireRefresh = () => setOutdated(true);
    const check = async () => {
      if (
        !import.meta.env.PROD ||
        !current ||
        checking ||
        document.visibilityState !== "visible"
      )
        return;
      checking = true;
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 5000);
      try {
        const response = await fetch("/index.html", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (
          !response.ok ||
          !response.headers.get("content-type")?.includes("text/html")
        )
          return;
        const latest = release(
          new DOMParser().parseFromString(await response.text(), "text/html"),
        );
        if (!disposed && latest && latest !== current) setOutdated(true);
      } catch {
        // A connection failure is not evidence of a different deployed version.
      } finally {
        window.clearTimeout(timeout);
        checking = false;
      }
    };
    void check();
    const interval = window.setInterval(() => void check(), 60000);
    const onFocus = () => void check();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("obras:client-outdated", requireRefresh);
    window.addEventListener("vite:preloadError", requireRefresh);
    return () => {
      disposed = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("obras:client-outdated", requireRefresh);
      window.removeEventListener("vite:preloadError", requireRefresh);
    };
  }, []);
  if (!outdated) return null;
  return (
    <aside className="app-update-notice" role="status">
      <FiRefreshCw />
      <div>
        <strong>Hay una nueva versión disponible.</strong>
        <p>Actualizá cuando hayas guardado tus cambios.</p>
      </div>
      <button onClick={() => window.location.reload()}>Actualizar ahora</button>
    </aside>
  );
}
