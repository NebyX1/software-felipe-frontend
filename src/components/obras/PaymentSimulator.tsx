import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowUpRight } from "react-icons/fi";
import type { Payment } from "../../domain/types";
import type { CheckoutSession, PaymentOrder } from "../../domain/checkout";
import { api, errorText } from "../../domain/api";
import { has, useSession } from "../../domain/session";
import { useApi } from "../../domain/hooks";
import { currency, Status } from "./UI";

export default function PaymentSimulator({
  workId,
  payment,
}: {
  workId: number;
  payment: Payment;
}) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const supplier = useSession((state) => state.user?.role === "empresa");
  const options = useApi<{ orders: PaymentOrder[] }>(
    "/payment-orders",
    supplier && payment.status === "contaduria_tesoreria",
  );
  const order = options.data?.orders.find(
    (row) => row.id === payment.id && row.work_id === workId,
  );
  const allowed = supplier
    ? !!(order?.can_pay || order?.can_resume)
    : has([
        "super_admin",
        "admin",
        "administrativo",
        "direccion_general",
        "director_obra",
        "tecnico",
        "inspector",
      ]);
  if (payment.status !== "contaduria_tesoreria") return null;
  return (
    <section className="payment-simulator">
      <h3>Pago electrónico</h3>
      <p className="hint">
        Orden lista para pagar · {currency(payment.amount)} · Pasarela DemoPay
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {supplier && <Status loading={options.isLoading} error={options.error} />}
      {allowed && (
        <button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              if (order?.can_resume && order.checkout_id) {
                navigate(`/pasarela/${order.checkout_id}`);
                return;
              }
              const response = await api.post<{ session: CheckoutSession }>(
                `/works/${workId}/payments/${payment.id}/checkout`,
                {},
              );
              navigate(response.data.session.checkout_url);
            } catch (err) {
              setError(errorText(err));
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy
            ? "Abriendo…"
            : supplier
              ? order?.can_resume
                ? "Continuar pago"
                : "Pagar en demo"
              : "Abrir pasarela"}
          <FiArrowUpRight />
        </button>
      )}
      <p className="hint">
        {supplier && !allowed
          ? order?.unavailable_reason || "Consultá las opciones en Pagos."
          : "La transferencia y su resultado se completan en la pasarela de prueba."}
      </p>
      {supplier && <Link to="/pagos">Ver todos los pagos</Link>}
    </section>
  );
}
