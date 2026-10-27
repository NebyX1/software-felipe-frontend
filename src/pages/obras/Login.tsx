import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useApi } from "../../domain/hooks";
import { api, errorText } from "../../domain/api";
import { useSession, roleNames } from "../../domain/session";
import type { User } from "../../domain/types";
import { Field, Status } from "../../components/obras/UI";
import ThemeToggle from "../../components/obras/ThemeToggle";
import { FiArrowRight, FiGlobe, FiHexagon } from "react-icons/fi";
export default function Login() {
  const accounts = useApi<{ accounts: User[]; access_required: boolean }>(
    "/auth/accounts",
  );
  const [email, setEmail] = useState("general@demo.invalid");
  const [accessCode, setAccessCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const client = useQueryClient();
  return (
    <div className="login-page">
      <div className="login-frame">
        <header className="login-header">
          <Link to="/login" className="brand">
            <span className="brand-mark">
              <FiHexagon />
              <span>L</span>
            </span>
            <span className="brand-wordmark">
              Lavalleja<span className="brand-dot">.OS</span>
              <small>Dirección de Obras</small>
            </span>
          </Link>
          <ThemeToggle />
        </header>
        <div className="login-body">
          <div className="login-intro">
            <span className="eyebrow">GESTIÓN TERRITORIAL · LAVALLEJA</span>
            <h1>
              Cada obra.
              <br />
              Un futuro compartido.
            </h1>
            <p>
              Planificación, ejecución y mantenimiento conectados con sus
              documentos, equipos y trámites.
            </p>
            <div className="lifecycle">
              Proyecto <span>→</span> Obra <span>→</span> Posobra
            </div>
          </div>
          <form
            className="login-card"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              try {
                const r = (
                  await api.post<{ token: string; user: User }>("/auth/login", {
                    account: email,
                    access_code: accessCode,
                  })
                ).data;
                client.clear();
                useSession.getState().set(r.token, r.user);
                navigate("/");
              } catch (err) {
                setError(errorText(err));
              } finally {
                setBusy(false);
              }
            }}
          >
            <span className="demo-tag">Entorno de demostración</span>
            <h2>Ingresar al sistema</h2>
            <p>
              Empezá con Dirección General para explorar el plan de obras. Podés
              elegir otros perfiles de prueba para conocer sus tareas.
            </p>
            <Status loading={accounts.isLoading} error={accounts.error} />
            <Field label="Cuenta de prueba">
              <select
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              >
                <option value="">Seleccionar cuenta</option>
                {accounts.data?.accounts.map((u) => (
                  <option key={u.id} value={u.email}>
                    {u.name} · {roleNames[u.role]}
                  </option>
                ))}
              </select>
            </Field>
            {accounts.data?.access_required && (
              <Field label="Código de acceso a la demo">
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Código recibido con la invitación"
                />
              </Field>
            )}
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button
              disabled={
                busy || !accounts.data?.accounts.some((u) => u.email === email)
              }
            >
              <span>
                {busy ? "Ingresando…" : "Ingresar al espacio de trabajo"}
              </span>
              <FiArrowRight />
            </button>
            <Link to="/publico">
              <FiGlobe /> Consultar obras públicas
            </Link>
            <small>
              Las aprobaciones internas y pagos del entorno son ficticios.
            </small>
          </form>
        </div>
        <div className="login-footer">
          <span>Intendencia Departamental de Lavalleja</span>
          <span>Proyecto · Obra · Posobra</span>
        </div>
      </div>
    </div>
  );
}
