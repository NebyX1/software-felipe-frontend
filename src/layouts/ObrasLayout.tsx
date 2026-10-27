import { useEffect, useState } from "react";
import { Link, NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";

import {
  FiGrid,
  FiBriefcase,
  FiSettings,
  FiLogOut,
  FiGlobe,
  FiInbox,
  FiCreditCard,
  FiUsers,
  FiBell,
  FiHexagon,
  FiMenu,
  FiX,
  FiShield,
} from "react-icons/fi";
import { useSession, roleNames, admins, has } from "../domain/session";
import { get, action } from "../domain/api";
import type { User } from "../domain/types";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import ThemeToggle from "../components/obras/ThemeToggle";
export default function ObrasLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);
  const { token, user, set, identify } = useSession();
  const navigate = useNavigate();
  const client = useQueryClient();
  const notices = useQuery({
    queryKey: ["/notifications"],
    queryFn: () => get<{ unread: number }>("/notifications"),
    enabled: !!token && !!user,
    refetchInterval: 30000,
  });
  useEffect(() => {
    if (token)
      get<{ user: User }>("/auth/me")
        .then((r) => identify(r.user))
        .catch(() => set(null, null));
  }, [token, identify, set]);
  if (!token) return <Navigate to="/login" replace />;
  if (!user) return <p className="empty">Verificando sesión…</p>;
  const logout = async () => {
    try {
      await action("/auth/logout");
    } finally {
      set(null, null);
      client.clear();
      navigate("/login");
    }
  };
  return (
    <div className="shell">
      {menuOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Cerrar menú al tocar fuera"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside className={`sidebar ${menuOpen ? "is-open" : ""}`}>
        <Link to="/" className="brand" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark">
            <FiHexagon />
            <span>L</span>
          </span>
          <span className="brand-wordmark">
            Lavalleja<span className="brand-dot">.OS</span>
            <small>Dirección de Obras</small>
          </span>
        </Link>
        <button
          type="button"
          className="mobile-sidebar-close"
          aria-label="Cerrar menú principal"
          onClick={() => setMenuOpen(false)}
        >
          <FiX />
        </button>
        <div className="surface-label">ESPACIO DE TRABAJO</div>
        <nav
          id="primary-navigation"
          aria-label="Principal"
          onClick={() => setMenuOpen(false)}
        >
          <NavLink to="/" end>
            <FiGrid />
            Panel general
          </NavLink>
          <NavLink to="/obras">
            <FiBriefcase />
            Intervenciones
          </NavLink>
          <NavLink to="/bandeja">
            <FiInbox />
            Bandeja de trabajo
            {Boolean(notices.data?.unread) && (
              <span className="notification-count">{notices.data?.unread}</span>
            )}
          </NavLink>
          <NavLink to="/pagos">
            <FiCreditCard />
            Pagos
          </NavLink>
          <NavLink to="/guia-demo">
            <FiGlobe /> Guía de la demo
          </NavLink>
          {has([
            "empresa",
            "super_admin",
            "admin",
            "direccion_general",
            "administrativo",
          ]) && (
            <NavLink to="/empresas">
              <FiUsers />
              {user.role === "empresa" ? "Mi empresa" : "Empresas"}
            </NavLink>
          )}
          {has(admins) && (
            <NavLink to="/administracion">
              <FiSettings />
              Administración
            </NavLink>
          )}
          <Link to="/publico">
            <FiGlobe />
            Consulta pública
          </Link>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <FiShield />
            <strong>Entorno de demo</strong>
            <p>Explorá el circuito completo de una obra con datos de prueba.</p>
            <span>
              <i className="live-dot" /> Pagos y aprobaciones ficticios
            </span>
          </div>
          <button className="ghost" onClick={logout}>
            <FiLogOut />
            Cerrar sesión
          </button>
        </div>
      </aside>
      <div className="workspace" inert={menuOpen}>
        <header className="topbar">
          <button
            type="button"
            className="mobile-menu-toggle"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú principal"}
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>
          <div className="topbar-context">
            <span className="live-dot" />
            <span>Sistema en línea</span>
            <i aria-hidden="true">/</i>
            <span>Gestión territorial</span>
          </div>
          <div className="topbar-actions">
            <Link to="/bandeja" className="notification-link">
              <FiBell /> <span>{notices.data?.unread || 0}</span>
              <span className="sr-only">avisos sin leer</span>
            </Link>
            <ThemeToggle />
            <div
              className="topbar-user"
              title={`${user.name} · ${roleNames[user.role]}`}
            >
              <span className="user-avatar">
                {user.name
                  .split(" ")
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")}
              </span>
              <span>
                <strong>{user.name}</strong>
                <small>{roleNames[user.role]}</small>
              </span>
            </div>
          </div>
        </header>
        <main className="workspace-main">
          <Outlet />
        </main>
        <footer>
          Gestión de proyectos, obras y posobra · Datos de demostración
        </footer>
      </div>
    </div>
  );
}
