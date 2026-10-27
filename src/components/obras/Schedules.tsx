import { useState } from "react";
import type { Activity, Schedule, Actor } from "../../domain/types";
import { useApi, useAction } from "../../domain/hooks";
import { has, editors, directors } from "../../domain/session";
import { Panel, Badge, Field, Status } from "./UI";
export default function Schedules({
  workId,
  actors,
}: {
  workId: number;
  actors: Actor[];
}) {
  const schedules = useApi<{ schedules: Schedule[] }>(
    `/works/${workId}/schedules`,
  );
  const [editing, setEditing] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const run = useAction();
  const internal = actors.filter((a) => a.user_id);
  const change = (
    index: number,
    field: string,
    value: string | number | boolean,
  ) =>
    setActivities((all) =>
      all.map((a, i) => (i === index ? { ...a, [field]: value } : a)),
    );
  return (
    <>
      <Panel
        title="Cronogramas y líneas base"
        actions={
          has(editors) && (
            <button
              onClick={() => {
                setActivities([
                  {
                    title: "",
                    start: "",
                    end: "",
                    responsible_id: internal[0]?.user_id || 0,
                  },
                ]);
                setEditing(true);
              }}
            >
              Nuevo cronograma
            </button>
          )
        }
      >
        <Status
          loading={schedules.isLoading}
          error={schedules.error}
          empty={!schedules.data?.schedules.length}
        />
        {schedules.data?.schedules.map((s) => (
          <article
            className="record-card"
            key={s.id}
            style={{ marginBottom: 15 }}
          >
            <div className="section-heading">
              <h3>
                {s.kind} · línea base v{s.version}
              </h3>
              <Badge value={s.status} />
            </div>
            <small>{s.reason}</small>
            <Gantt activities={s.activities} />
            <details>
              <summary>Fechas, rubros y responsables</summary>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Actividad</th>
                      <th>Rubro</th>
                      <th>Inicio</th>
                      <th>Fin</th>
                      <th>Responsable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.activities.map((a, i) => (
                      <tr key={i}>
                        <td>
                          {a.title}
                          {a.milestone ? " · Hito" : ""}
                        </td>
                        <td>{a.code || "—"}</td>
                        <td>{a.start}</td>
                        <td>{a.end}</td>
                        <td>
                          {actors.find((x) => x.user_id === a.responsible_id)
                            ?.name || `#${a.responsible_id}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
            <div className="actions">
              {s.status === "borrador" && has(directors) && (
                <button
                  onClick={() =>
                    run(`/works/${workId}/schedules/${s.id}/approve`)
                  }
                >
                  Aprobar línea base
                </button>
              )}
              {has(editors) && (
                <button
                  className="ghost"
                  onClick={() => {
                    setActivities(s.activities.map((a) => ({ ...a })));
                    setEditing(true);
                  }}
                >
                  Crear revisión
                </button>
              )}
            </div>
          </article>
        ))}
      </Panel>
      {editing && (
        <Panel title="Planificar actividades">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              if (
                await run(`/works/${workId}/schedules`, {
                  kind: form.get("kind"),
                  reason: form.get("reason"),
                  activities,
                })
              )
                setEditing(false);
            }}
          >
            <div className="form-grid two">
              <Field label="Tipo">
                <select name="kind">
                  <option value="inicial">Inicial</option>
                  <option value="contractual">Contractual</option>
                </select>
              </Field>
              <Field label="Motivo / cambio respecto a la base">
                <input name="reason" required />
              </Field>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Actividad</th>
                    <th>Rubro</th>
                    <th>Inicio</th>
                    <th>Fin</th>
                    <th>Responsable</th>
                    <th>Hito</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {activities.map((a, i) => (
                    <tr key={i}>
                      <td>
                        <input
                          required
                          value={a.title}
                          aria-label={`Actividad ${i + 1}`}
                          onChange={(e) => change(i, "title", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          value={a.code || ""}
                          aria-label={`Rubro actividad ${i + 1}`}
                          onChange={(e) => change(i, "code", e.target.value)}
                        />
                      </td>
                      {(["start", "end"] as const).map((k) => (
                        <td key={k}>
                          <input
                            type="date"
                            required
                            value={a[k]}
                            aria-label={`${k} ${i + 1}`}
                            onChange={(e) => change(i, k, e.target.value)}
                          />
                        </td>
                      ))}
                      <td>
                        <select
                          value={a.responsible_id}
                          onChange={(e) =>
                            change(i, "responsible_id", Number(e.target.value))
                          }
                        >
                          {internal.map((x) => (
                            <option key={x.id} value={x.user_id || 0}>
                              {x.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Hito ${i + 1}`}
                          checked={a.milestone || false}
                          onChange={(e) =>
                            change(i, "milestone", e.target.checked)
                          }
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="ghost"
                          onClick={() =>
                            setActivities(activities.filter((_, j) => j !== i))
                          }
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="actions" style={{ marginTop: 15 }}>
              <button
                type="button"
                className="ghost"
                onClick={() =>
                  setActivities([
                    ...activities,
                    {
                      title: "",
                      start: "",
                      end: "",
                      responsible_id: internal[0]?.user_id || 0,
                    },
                  ])
                }
              >
                Agregar actividad
              </button>
              <button>Guardar cronograma</button>
              <button
                type="button"
                className="ghost"
                onClick={() => setEditing(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        </Panel>
      )}
    </>
  );
}
function Gantt({ activities }: { activities: Activity[] }) {
  if (!activities.length) return null;
  const first = Math.min(...activities.map((a) => Date.parse(a.start)));
  const last = Math.max(...activities.map((a) => Date.parse(a.end)));
  const span = Math.max(86400000, last - first);
  return (
    <div style={{ marginTop: 22 }}>
      <div className="gantt-dates">
        <span>{new Date(first).toISOString().slice(0, 10)}</span>
        <span>{new Date(last).toISOString().slice(0, 10)}</span>
      </div>
      {activities.map((a, i) => (
        <div className="gantt-row" key={i}>
          <span>{a.title}</span>
          <div className="gantt-track">
            <div
              className="gantt-bar"
              title={`${a.start} → ${a.end}`}
              style={{
                left: `${((Date.parse(a.start) - first) / span) * 100}%`,
                width: `${Math.max(1, ((Date.parse(a.end) - Date.parse(a.start)) / span) * 100)}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
