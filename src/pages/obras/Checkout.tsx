import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiLock,
  FiFileText,
  FiLoader,
  FiAlertCircle,
  FiCreditCard,
} from "react-icons/fi";
import { api, get, download, errorText } from "../../domain/api";
import type { CheckoutSession } from "../../domain/checkout";
import { useSession } from "../../domain/session";
import ThemeToggle from "../../components/obras/ThemeToggle";
import { Field, Status, currency } from "../../components/obras/UI";

export default function Checkout() {
  const { id } = useParams();
  const token = useSession((state) => state.token);
  const navigate = useNavigate();
  const client = useQueryClient();
  const url = `/checkout/${id}`;
  const query = useQuery({
    queryKey: [url],
    queryFn: () => get<{ session: CheckoutSession }>(url),
    enabled: !!token,
    refetchInterval: (q) =>
      q.state.data?.session.status === "processing" ? 600 : false,
    retry: 1,
  });
  const [account, setAccount] = useState("operativa");
  const [code, setCode] = useState("123456");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const session = query.data?.session;
  const selectedAccount = session?.accounts.find(
    (a) => a.id === (session.account || account),
  );
  const perform = async (operation: "authorize" | "cancel") => {
    setBusy(true);
    setError("");
    try {
      const response = await api.post<{ session: CheckoutSession }>(
        `${url}/${operation}`,
        operation === "authorize" ? { account, code } : {},
      );
      client.setQueryData([url], response.data);
      await client.invalidateQueries({ queryKey: ["/payment-orders"] });
      if (operation === "cancel") navigate("/pagos");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };
  const retry = async () => {
    if (!session) return;
    setBusy(true);
    setError("");
    try {
      const response = await api.post<{ session: CheckoutSession }>(
        `/works/${session.work_id}/payments/${session.payment_id}/checkout`,
        {},
      );
      setAccount("operativa");
      setCode("123456");
      navigate(response.data.session.checkout_url, { replace: true });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };
  if (!token) return <Navigate to="/login" replace />;
  return (
    <main className="checkout-page">
      <header className="checkout-header">
        <Link to="/pagos" className="checkout-brand">
          <span>
            <FiCreditCard />
          </span>
          <div>
            <strong>
              DemoPay<span>®</span>
            </strong>
            <small>Pasarela bancaria simulada</small>
          </div>
        </Link>
        <div className="checkout-header-tools">
          <span className="demo-tag">PRUEBA</span>
          <ThemeToggle />
        </div>
      </header>
      <Link to="/pagos" className="checkout-back">
        <FiArrowLeft /> Volver a pagos
      </Link>
      <Status loading={query.isLoading} error={query.error} />
      {session && (
        <div className="checkout-shell">
          <section className="checkout-main" aria-live="polite">
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            {session.status === "created" ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void perform("authorize");
                }}
              >
                <div className="eyebrow">
                  {session.presentation_mode
                    ? "DEMO DE TESORERÍA"
                    : "TRANSFERENCIA BANCARIA"}
                </div>
                <h1>Confirmá tu pago.</h1>
                <p className="checkout-lead">
                  {session.presentation_mode
                    ? "Para esta prueba usás una cuenta ficticia de Tesorería. Revisá la orden y confirmá la transferencia."
                    : "Revisá la orden y elegí desde qué cuenta pagar."}
                </p>
                <Field label="Cuenta de origen">
                  <select
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    disabled={busy || !session.can_authorize}
                  >
                    {session.accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} · {a.number}
                      </option>
                    ))}
                  </select>
                </Field>
                {selectedAccount && (
                  <div className="checkout-account">
                    <span className="checkout-account-icon">
                      <FiCreditCard />
                    </span>
                    <div>
                      <strong>{selectedAccount.holder}</strong>
                      <span>Cuenta ficticia {selectedAccount.number}</span>
                    </div>
                    <div className="checkout-balance">
                      <small>Saldo de prueba</small>
                      <strong>{currency(selectedAccount.balance)}</strong>
                    </div>
                  </div>
                )}
                <Field label="Código de autorización">
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={6}
                    required
                    pattern="[0-9]{6}"
                    disabled={busy || !session.can_authorize}
                  />
                </Field>
                <p className="checkout-code-hint">
                  Para esta demo, el código es <strong>123456</strong>.
                </p>
                {!session.can_authorize && (
                  <p className="hint">
                    Esta sesión pertenece a otro usuario. Podés consultar su
                    estado.
                  </p>
                )}
                <button
                  className="checkout-confirm"
                  type="submit"
                  disabled={busy || !session.can_authorize}
                >
                  <FiLock />
                  {busy ? "Enviando…" : "Confirmar transferencia"}
                  <FiArrowRight />
                </button>
                {session.can_authorize && (
                  <button
                    className="checkout-cancel"
                    type="button"
                    disabled={busy}
                    onClick={() => void perform("cancel")}
                  >
                    Cancelar y volver
                  </button>
                )}
                <p className="checkout-test-hint">
                  La cuenta sin saldo permite probar un pago rechazado.
                </p>
              </form>
            ) : session.status === "processing" ? (
              <div className="checkout-result">
                <span className="checkout-result-icon processing">
                  <FiLoader />
                </span>
                <div className="eyebrow">OPERACIÓN EN CURSO</div>
                <h1>Procesando transferencia…</h1>
                <p>
                  Esperando la respuesta del banco simulado. El resultado
                  aparecerá automáticamente.
                </p>
                <div className="checkout-processing-bar" />
                <small>Podés recargar esta página sin duplicar el pago.</small>
              </div>
            ) : (
              <div className="checkout-result">
                <span
                  className={`checkout-result-icon ${session.status === "succeeded" ? "success" : "failed"}`}
                >
                  {session.status === "succeeded" ? (
                    <FiCheck />
                  ) : (
                    <FiAlertCircle />
                  )}
                </span>
                <div className="eyebrow">
                  {session.status === "succeeded"
                    ? "TRANSFERENCIA COMPLETADA"
                    : session.status === "failed"
                      ? "TRANSFERENCIA RECHAZADA"
                      : "SESIÓN CERRADA"}
                </div>
                <h1>
                  {session.status === "succeeded"
                    ? "Pago realizado."
                    : session.status === "failed"
                      ? "El pago no se completó."
                      : session.status === "expired"
                        ? "La sesión venció."
                        : "Pago cancelado."}
                </h1>
                <p>
                  {session.status === "succeeded"
                    ? `Transferiste ${currency(session.amount)} a ${session.company_name}.`
                    : session.message}
                </p>
                {session.status === "succeeded" && session.receipt_id ? (
                  <button
                    className="checkout-confirm"
                    onClick={() =>
                      void download(
                        `/documents/${session.receipt_id}/download`,
                        `comprobante-${session.reference}.pdf`,
                      )
                    }
                  >
                    <FiFileText />
                    Descargar comprobante
                  </button>
                ) : (
                  session.can_authorize && (
                    <button
                      className="checkout-confirm"
                      disabled={busy}
                      onClick={() => void retry()}
                    >
                      {busy ? "Abriendo…" : "Intentar nuevamente"}
                      <FiArrowRight />
                    </button>
                  )
                )}
                <Link className="checkout-return" to="/pagos">
                  <FiArrowLeft /> Volver a pagos
                </Link>
              </div>
            )}
          </section>
          <aside className="checkout-summary" aria-label="Resumen del pago">
            <div className="eyebrow">RESUMEN DEL PAGO</div>
            <div className="checkout-recipient-icon">
              <FiCreditCard />
            </div>
            <h2>{session.company_name}</h2>
            <p>{session.work_name.replace(" · Pago de prueba", "")}</p>
            <div className="checkout-total">
              <span>Total a transferir</span>
              <strong>{currency(session.amount)}</strong>
              <small>Pesos uruguayos · UYU</small>
            </div>
            <dl>
              <div>
                <dt>Orden de pago</dt>
                <dd>{session.reference}</dd>
              </div>
              <div>
                <dt>Factura</dt>
                <dd>{session.invoice_number}</dd>
              </div>
              <div>
                <dt>Cuenta de destino</dt>
                <dd>{session.destination}</dd>
              </div>
              {session.transaction && (
                <div>
                  <dt>Operación</dt>
                  <dd>{session.transaction}</dd>
                </div>
              )}
              {session.closing_balance !== null && (
                <div>
                  <dt>Saldo de prueba restante</dt>
                  <dd>{currency(session.closing_balance)}</dd>
                </div>
              )}
            </dl>
            <div className="checkout-sandbox-note">
              <FiLock />
              <p>
                Entorno de prueba.
                <br />
                Cuentas y fondos ficticios. Sin conexión a un banco real.
              </p>
            </div>
          </aside>
        </div>
      )}
      <footer className="checkout-footer">
        DemoPay · Simulador de transferencias para Lavalleja.OS
      </footer>
    </main>
  );
}
