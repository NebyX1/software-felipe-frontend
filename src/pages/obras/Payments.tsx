import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiArrowUpRight,
  FiPlus,
  FiFileText,
  FiCheck,
  FiClock,
  FiCreditCard,
} from "react-icons/fi";
import { api, get, download, errorText } from "../../domain/api";
import type { CheckoutSession, PaymentOrder } from "../../domain/checkout";
import { Field, Status, currency } from "../../components/obras/UI";

interface Orders {
  orders: PaymentOrder[];
  sandbox: boolean;
  can_create_example: boolean;
  view: "supplier" | "operator" | "read_only";
}
export default function Payments() {
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    if (params.has("demo")) {
      const next = new URLSearchParams(params);
      next.delete("demo");
      setParams(next, { replace: true });
    }
  }, [params, setParams]);
  const rows = useQuery({
    queryKey: ["/payment-orders"],
    queryFn: () => get<Orders>("/payment-orders"),
    refetchInterval: (query) =>
      query.state.data?.orders.some((p) => p.status === "processing")
        ? 1500
        : false,
  });
  const client = useQueryClient();
  const navigate = useNavigate();
  const [tab, setTab] = useState("ready");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<number | "example" | null>(null);
  const [error, setError] = useState("");
  const [key, setKey] = useState(() => crypto.randomUUID());
  const orders = rows.data?.orders || [];
  const view = rows.data?.view || "read_only";
  const canCreate = !!rows.data?.can_create_example;
  const pending = orders.filter(
    (o) => o.status === "ready" || o.status === "processing",
  );
  const history = orders.filter((o) => o.status === "paid");
  const visible = (tab === "ready" ? pending : history).filter((o) =>
    `${o.work_name} ${o.company_name} ${o.reference}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const pay = async (order: PaymentOrder) => {
    setBusy(order.id);
    setError("");
    try {
      if (order.can_resume && order.checkout_id) {
        navigate(`/pasarela/${order.checkout_id}`);
        return;
      }
      const response = await api.post<{ session: CheckoutSession }>(
        `/works/${order.work_id}/payments/${order.id}/checkout`,
        {},
      );
      navigate(response.data.session.checkout_url);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(null);
    }
  };
  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">
            {view === "supplier"
              ? "PORTAL DE EMPRESA · DEMO DE PAGOS"
              : "TESORERÍA · PAGOS ELECTRÓNICOS"}
          </div>
          <h1>Pagos</h1>
          <p>
            {view === "supplier" && canCreate
              ? "Probá un pago ficticio desde tu perfil y consultá las transferencias a tu empresa."
              : canCreate
                ? "Elegí una orden y completá la transferencia en la pasarela de prueba."
                : "Consultá los pagos pendientes y sus comprobantes."}
          </p>
        </div>
        {canCreate && (
          <button
            className="ghost"
            disabled={busy !== null}
            onClick={async () => {
              setBusy("example");
              setError("");
              try {
                await api.post("/payment-orders/example", {
                  idempotency_key: key,
                });
                setKey(crypto.randomUUID());
                setTab("ready");
                setSearch("");
                await client.invalidateQueries();
              } catch (err) {
                setError(errorText(err));
              } finally {
                setBusy(null);
              }
            }}
          >
            <FiPlus />
            {busy === "example" ? "Preparando…" : "Nuevo pago de prueba"}
          </button>
        )}
      </div>
      <div className="pay-intro">
        <span className="pay-intro-icon">
          <FiCreditCard />
        </span>
        <div>
          <strong>
            {view === "supplier" && canCreate
              ? "Podés pagar los ejemplos sin cambiar de perfil."
              : canCreate
                ? "Pagá como en una pasarela bancaria."
                : "Seguimiento de pagos."}
          </strong>
          <p>
            {view === "supplier" && canCreate
              ? "Pagar en demo abre la pasarela con una cuenta ficticia de Tesorería. Nuevo pago de prueba permite repetir el recorrido."
              : canCreate
                ? "Abrí el pago, revisá el destinatario y confirmá. Recibirás el resultado y el comprobante automáticamente."
                : "Tesorería realiza las transferencias. Acá podés consultar su estado y descargar los comprobantes."}
          </p>
        </div>
        <span className="demo-tag">Modo de prueba</span>
      </div>
      <div className="pay-toolbar">
        <div
          className="pay-tabs"
          role="tablist"
          aria-label="Estado de los pagos"
        >
          <button
            role="tab"
            aria-selected={tab === "ready"}
            className={tab === "ready" ? "active" : ""}
            onClick={() => setTab("ready")}
          >
            Pendientes <span>{pending.length}</span>
          </button>
          <button
            role="tab"
            aria-selected={tab === "history"}
            className={tab === "history" ? "active" : ""}
            onClick={() => setTab("history")}
          >
            Historial <span>{history.length}</span>
          </button>
        </div>
        <Field label="Buscar pago">
          <input
            placeholder="Obra, empresa u orden"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Field>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <Status loading={rows.isLoading} error={rows.error} />
      <div className="pay-orders">
        {visible.map((order) => (
          <article
            className={`pay-order ${order.is_example ? "is-example" : ""}`}
            key={order.id}
          >
            <div className="pay-order-copy">
              <div className="pay-order-kicker">
                {order.reference}
                {order.is_example && (
                  <span className="demo-tag">Ejemplo para demo</span>
                )}
              </div>
              <h2>{order.company_name}</h2>
              <p>
                {order.work_name
                  .replace(" · Pago de prueba", "")
                  .replace(" · Demo Tesorería", "")}
              </p>
              <small>Factura {order.invoice_number || "de demostración"}</small>
              {order.checkout_status === "failed" &&
                order.status === "ready" && (
                  <small className="pay-last-failure">
                    El último intento no se completó. Podés intentar nuevamente.
                  </small>
                )}
            </div>
            <div className="pay-order-amount">
              <strong>{currency(order.amount)}</strong>
              <small>Pesos uruguayos · UYU</small>
              <span className={`pay-status ${order.status}`}>
                {order.status === "paid" ? <FiCheck /> : <FiClock />}
                {order.status === "paid"
                  ? "Pagado"
                  : order.status === "processing"
                    ? "Procesando"
                    : "Pendiente de pago"}
              </span>
            </div>
            <div className="pay-order-action">
              {order.status === "paid" ? (
                <>
                  {order.receipt_id && (
                    <button
                      className="ghost"
                      onClick={() =>
                        download(
                          `/documents/${order.receipt_id}/download`,
                          `comprobante-${order.reference}.pdf`,
                        )
                      }
                    >
                      <FiFileText />
                      Comprobante
                    </button>
                  )}
                  <Link to={`/obras/${order.work_id}?tab=certificados`}>
                    Ver antecedentes
                  </Link>
                </>
              ) : order.can_pay || order.can_resume ? (
                <>
                  <button disabled={busy !== null} onClick={() => pay(order)}>
                    {busy === order.id
                      ? "Abriendo…"
                      : order.can_resume
                        ? "Continuar pago"
                        : order.checkout_status === "failed"
                          ? "Reintentar pago"
                          : order.presentation_mode
                            ? "Pagar en demo"
                            : "Pagar"}
                    <FiArrowUpRight />
                  </button>
                  <small>Se abrirá DemoPay</small>
                </>
              ) : (
                <small>
                  {order.status === "processing"
                    ? "Esperando respuesta de la pasarela"
                    : order.unavailable_reason ||
                      "Este perfil tiene acceso de consulta."}
                </small>
              )}
            </div>
          </article>
        ))}
      </div>
      {!rows.isLoading && rows.data && !visible.length && (
        <div className="pay-empty">
          <FiCheck />
          <h2>
            {tab === "ready"
              ? "No hay pagos pendientes."
              : "Todavía no hay pagos realizados."}
          </h2>
          <p>
            {tab === "ready" && canCreate
              ? "Podés crear una orden ficticia con Nuevo pago de prueba."
              : tab === "ready"
                ? "Las órdenes pendientes aparecerán acá."
                : "Los pagos completados aparecerán acá con su comprobante."}
          </p>
        </div>
      )}
      <p className="pay-footnote">
        DemoPay es una pasarela simulada. Utiliza cuentas ficticias y no mueve
        fondos.
      </p>
    </>
  );
}
