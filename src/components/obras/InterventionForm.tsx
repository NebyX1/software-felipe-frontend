import { useCallback, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import type { Work, Reference } from "../../domain/types";
import { useApi, useRefresh } from "../../domain/hooks";
import { action } from "../../domain/api";
import { Field, Panel } from "./UI";
import LocationPicker from "./LocationPicker";
const number = z
  .string()
  .regex(/^\d+(\.\d+)?$/, "Ingresá un número no negativo");
const coordinate = z
  .string()
  .refine((v) => !v || /^-?\d+(\.\d+)?$/.test(v), "Coordenada inválida");
const schema = z
  .object({
    name: z.string().min(3, "Ingresá al menos tres caracteres"),
    description: z.string().min(1, "Describí el objeto"),
    locality: z.string().min(1),
    location: z.string().min(1),
    intervention_type: z.string().min(1),
    objective: z.string().min(1),
    latitude: coordinate,
    longitude: coordinate,
    surface: number,
    budget: number,
    start_date: z.string(),
    end_date: z.string(),
    unit_id: z.string(),
    funding: z.array(
      z.object({ name: z.string().min(1, "Indicá la fuente"), amount: number }),
    ),
  })
  .refine((v) => Boolean(v.latitude) === Boolean(v.longitude), {
    message: "Ingresá ambas coordenadas o dejá ambas vacías",
    path: ["latitude"],
  })
  .refine(
    (v) =>
      !v.latitude ||
      (Number(v.latitude) >= -90 &&
        Number(v.latitude) <= 90 &&
        Number(v.longitude) >= -180 &&
        Number(v.longitude) <= 180),
    { message: "Coordenadas fuera de rango", path: ["latitude"] },
  );
type Values = z.infer<typeof schema>;
type Scalar = Exclude<keyof Values, "funding">;
export default function InterventionForm({
  work,
  onClose,
}: {
  work?: Work;
  onClose?: () => void;
}) {
  const ref = useApi<Reference>("/reference");
  const refresh = useRefresh();
  const navigate = useNavigate();
  const [mapOpen, setMapOpen] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: work?.name || "",
      description: work?.description || "",
      locality: work?.locality || "Minas",
      location: work?.location || "",
      intervention_type: work?.intervention_type || "Edificio",
      objective: work?.objective || "patrimonio",
      latitude: work?.latitude ?? "",
      longitude: work?.longitude ?? "",
      surface: work?.surface || "0",
      budget: work?.budget || "0",
      start_date: work?.start_date || "",
      end_date: work?.end_date || "",
      unit_id: String(work?.unit_id || ""),
      funding:
        work?.funding.map((f) => ({ name: f.name, amount: f.amount })) || [],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "funding",
  });
  const { setValue, trigger } = form;
  const pick = useCallback(
    (lat: string, lon: string) => {
      setValue("latitude", lat);
      setValue("longitude", lon);
      void trigger(["latitude", "longitude"]);
    },
    [setValue, trigger],
  );
  const input = (
    name: Scalar,
    caption: string,
    type = "text",
    kind?: string,
  ) => (
    <Field label={caption}>
      <input
        type={type}
        aria-label={caption}
        aria-invalid={Boolean(form.formState.errors[name])}
        {...form.register(name)}
        list={kind ? `catalog-${kind}` : undefined}
      />
      {kind && (
        <datalist id={`catalog-${kind}`}>
          {ref.data?.catalog
            .filter((c) => c.kind === kind)
            .map((c) => (
              <option value={c.label} key={c.id} />
            ))}
        </datalist>
      )}
      {form.formState.errors[name] && (
        <small className="error">{form.formState.errors[name]?.message}</small>
      )}
    </Field>
  );
  return (
    <Panel title={work ? "Editar ficha" : "Nueva intervención"}>
      <form
        onSubmit={form.handleSubmit(async (values) => {
          try {
            const r = await action<{ work: Work }>(
              work ? `/works/${work.id}` : "/works",
              {
                ...values,
                latitude: values.latitude || null,
                longitude: values.longitude || null,
                unit_id: Number(values.unit_id) || null,
                version: work?.version,
              },
              work ? "patch" : "post",
            );
            await refresh();
            onClose?.();
            if (!work) navigate(`/obras/${r.work.id}`);
          } catch {
            /* API displays validation */
          }
        })}
      >
        <div className="form-grid">
          {input("name", "Nombre")}
          {input("locality", "Localidad")}
          {input("location", "Ubicación / dirección")}
          {input("intervention_type", "Tipo de intervención", "text", "tipo")}
          {input("objective", "Objetivo estratégico", "text", "objetivo")}
          {input("surface", "Superficie (m²)")}
          {input("budget", "Presupuesto (UYU)")}
          {input("latitude", "Latitud")}
          {input("longitude", "Longitud")}
          {input("start_date", "Inicio previsto", "date")}
          {input("end_date", "Fin previsto", "date")}
          <Field label="Unidad">
            <select {...form.register("unit_id")}>
              <option value="">Sin unidad</option>
              {ref.data?.units.map((u) => (
                <option value={u.id} key={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="actions">
          <button
            type="button"
            className="ghost"
            onClick={() => setMapOpen(!mapOpen)}
          >
            {mapOpen
              ? "Ocultar mapa de ubicación"
              : "Elegir ubicación en el mapa"}
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() => {
              setValue("latitude", "");
              setValue("longitude", "");
            }}
          >
            Dejar sin coordenadas
          </button>
          <small>
            Coordenadas opcionales. La obra sin ubicación no aparecerá como
            punto en el mapa.
          </small>
        </div>
        {mapOpen && (
          <LocationPicker
            latitude={form.watch("latitude")}
            longitude={form.watch("longitude")}
            onPick={pick}
          />
        )}
        <h3>Fuentes de financiación</h3>
        <datalist id="catalog-funding">
          {ref.data?.catalog
            .filter((c) => c.kind === "financiacion")
            .map((c) => (
              <option value={c.label} key={c.id} />
            ))}
        </datalist>
        {fields.map((f, index) => (
          <div className="funding-row" key={f.id}>
            <Field label={`Fuente de financiación ${index + 1}`}>
              <input
                {...form.register(`funding.${index}.name`)}
                list="catalog-funding"
                required
              />
              {form.formState.errors.funding?.[index]?.name && (
                <small className="error">Indicá la fuente</small>
              )}
            </Field>
            <Field label={`Monto de financiación ${index + 1} (UYU)`}>
              <input
                {...form.register(`funding.${index}.amount`)}
                inputMode="decimal"
                required
              />
              {form.formState.errors.funding?.[index]?.amount && (
                <small className="error">Monto no válido</small>
              )}
            </Field>
            <button
              type="button"
              className="ghost"
              onClick={() => remove(index)}
            >
              Quitar fuente {index + 1}
            </button>
          </div>
        ))}
        <button
          type="button"
          className="ghost"
          onClick={() => append({ name: "", amount: "0" })}
        >
          Agregar fuente de financiación
        </button>
        <Field label="Descripción / objeto">
          <textarea {...form.register("description")} rows={3} />
          {form.formState.errors.description && (
            <small className="error">
              {form.formState.errors.description.message}
            </small>
          )}
        </Field>
        <div className="actions">
          <button disabled={form.formState.isSubmitting}>Guardar ficha</button>
          {onClose && (
            <button type="button" className="ghost" onClick={onClose}>
              Cancelar
            </button>
          )}
        </div>
      </form>
    </Panel>
  );
}
