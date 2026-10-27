import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "./types";
export const useSession = create<{
  token: string | null;
  user: User | null;
  set: (token: string | null, user: User | null) => void;
  identify: (user: User) => void;
}>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      set: (token, user) => set({ token, user }),
      identify: (user) => set({ user }),
    }),
    { name: "obras-session", partialize: (s) => ({ token: s.token }) },
  ),
);
export const editors = [
  "super_admin",
  "admin",
  "direccion_general",
  "director_obra",
  "tecnico",
];
export const directors = [
  "super_admin",
  "admin",
  "direccion_general",
  "director_obra",
];
export const generals = ["super_admin", "admin", "direccion_general"];
export const admins = ["super_admin", "admin"];
export const roleNames: Record<string, string> = {
  super_admin: "Administración del sistema",
  admin: "Administración",
  direccion_general: "Dirección General",
  director_obra: "Dirección de Obra",
  tecnico: "Técnica de proyecto",
  inspector: "Inspección",
  administrativo: "Administración de trámites",
  consulta: "Consulta ejecutiva",
  empresa: "Portal de empresa",
};
export const has = (roles: string[]) =>
  roles.includes(useSession.getState().user?.role || "");
