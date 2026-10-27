import { createRoot } from "react-dom/client";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-700.css";
import "@fontsource/instrument-serif/latin-400.css";
import "./styles/ObrasV2.css";
import Router from "./router/WorkRouter";
import { QueryClientProvider } from "@tanstack/react-query";
import queryClient from "./api/queryClient";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <QueryClientProvider client={queryClient}>
    <Router />
  </QueryClientProvider>,
);
