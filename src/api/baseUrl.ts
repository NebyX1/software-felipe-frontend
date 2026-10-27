/** Shared by both API clients; accepts an origin or an /api prefix. */
const configured = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "");
export const apiBaseUrl = !configured
  ? "/api"
  : configured.endsWith("/api")
    ? configured
    : `${configured}/api`;
