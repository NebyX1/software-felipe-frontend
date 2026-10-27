import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5178,
    host: "127.0.0.1",
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5008",
        changeOrigin: true,
      },
      "/admin": { target: "http://127.0.0.1:5008", changeOrigin: true },
    },
  },
});
