import type { ReactNode } from "react";
import { errorText } from "../../domain/api";
export const currency = (value: string | number) =>
  new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "UYU",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
export const label = (value: string) => value?.replaceAll("_", " ") || "—";
export function Badge({ value }: { value: string }) {
  return <span className={`badge ${value}`}>{label(value)}</span>;
}
export function Field({
  label: caption,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{caption}</span>
      {children}
    </label>
  );
}
export function Panel({
  title,
  children,
  actions,
}: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="panel">
      <div className="section-heading">
        <h2>{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}
export function Status({
  loading,
  error,
  empty,
}: {
  loading?: boolean;
  error?: unknown;
  empty?: boolean;
}) {
  if (loading)
    return (
      <p role="status" className="empty">
        Cargando información…
      </p>
    );
  if (error)
    return (
      <p role="alert" className="error">
        {errorText(error)}
      </p>
    );
  if (empty)
    return (
      <p className="empty">No hay registros. Las altas aparecerán aquí.</p>
    );
  return null;
}
export function Progress({ value }: { value: string }) {
  return (
    <div className="progress">
      <span style={{ width: `${Math.min(100, Number(value))}%` }} />
    </div>
  );
}
export function DecimalInput(
  props: React.InputHTMLAttributes<HTMLInputElement>,
) {
  return (
    <input
      type="text"
      inputMode="decimal"
      pattern="-?[0-9]+([.][0-9]+)?"
      {...props}
    />
  );
}
export function Confirm({
  text,
  onConfirm,
}: {
  text: string;
  onConfirm: () => void;
}) {
  return (
    <button
      type="button"
      className="danger ghost"
      onClick={() => {
        if (window.confirm(text)) onConfirm();
      }}
    >
      Eliminar
    </button>
  );
}
