import { Link } from "react-router-dom";
import { FiArrowUpRight, FiCheckCircle, FiClock } from "react-icons/fi";
import { useApi } from "../../domain/hooks";
import type { Work } from "../../domain/types";
import { useSession, roleNames } from "../../domain/session";
import { Panel, Status } from "../../components/obras/UI";
import { download } from "../../domain/api";

export default function DemoGuide() {
  const user = useSession((state) => state.user);
  const scenarios = useApi<{ works: Work[]; assistant_available: boolean }>(
    "/demo/scenarios",
  );
  const target = (code: string, tab: string) => {
    const work = scenarios.data?.works.find((row) => row.code === code);
    return work ? `/obras/${work.id}?tab=${tab}` : "/obras";
  };
  const steps = [
    {
      title: "Conocé el plan de obras",
      description:
        "Explorá los indicadores, las etapas y el mapa. Los importes certificados y pagados se muestran por separado.",
      to: "/",
      action: "Abrir panel",
    },
    {
      title: "Recorré un proyecto",
      description:
        "Revisá la ficha, el equipo y los documentos del proyecto. En Intervenciones podés buscar y filtrar la cartera.",
      to: target("DEMO-PROYECTO", "ficha"),
      action: "Ver proyecto",
    },
    {
      title: "Revisá una obra en ejecución",
      description:
        "Abrí el contrato, los rubros y el cronograma. En Documentos podés ver el plano de prueba y su historial.",
      to: target("DEMO-MOLINO", "rubrado"),
      action: "Ver obra y contrato",
    },
    {
      title: "Consultá la certificación",
      description:
        "Seguí los avances, la factura y las aprobaciones. Empresa presenta avances, Dirección de Obra revisa y Dirección General aprueba.",
      to: target("DEMO-MOLINO", "certificados"),
      action: "Ver certificación",
    },
    {
      title: "Probá un pago ficticio",
      description:
        "En Pagos, elegí Nuevo pago de prueba y abrí la pasarela. Usá Cuenta operativa y el código 123456. Cuenta sin saldo muestra rechazo y permite reintentar.",
      to: "/pagos",
      action: "Ir a Pagos",
    },
    {
      title: "Explorá recepción y mantenimiento",
      description:
        "Revisá las observaciones, la recepción provisoria y los próximos mantenimientos. La bandeja reúne avisos y compromisos.",
      to: target("DEMO-POSOBRA", "registros"),
      action: "Ver posobra",
    },
  ];
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">ESPACIO DE EVALUACIÓN · LAVALLEJA</span>
          <h1>Tu primer recorrido</h1>
          <p>
            Conocé la gestión de obras a tu ritmo, con ejemplos y documentos
            ficticios.
          </p>
        </div>
        <span className="badge">
          <FiClock /> 15–20 minutos
        </span>
      </div>
      <Panel title="Antes de empezar">
        <p>
          Estás usando el perfil{" "}
          <strong>{roleNames[user?.role || ""] || "de prueba"}</strong>. Cada
          perfil conserva sus permisos. Para probar otra tarea, cerrá sesión y
          elegí la cuenta correspondiente; si recibiste un código de acceso,
          volvé a ingresarlo.
        </p>
        <p className="hint">
          <FiCheckCircle /> Podés recorrer y editar los ejemplos. Tus cambios se
          conservan al recargar. Las aprobaciones y los pagos de esta demo no
          tienen efectos institucionales ni mueven dinero.
        </p>
      </Panel>
      <Status loading={scenarios.isLoading} error={scenarios.error} />
      <div className="demo-guide-grid">
        {steps.map((step, index) => (
          <section className="panel demo-guide-step" key={step.title}>
            <span className="eyebrow">
              PASO {String(index + 1).padStart(2, "0")}
            </span>
            <h2>{step.title}</h2>
            <p>{step.description}</p>
            <Link className="button-link" to={step.to}>
              {step.action} <FiArrowUpRight />
            </Link>
          </section>
        ))}
      </div>
      <Panel title="Asistencia documental">
        <p>
          {scenarios.data?.assistant_available
            ? "El asistente está habilitado. Primero indexá el plano digital desde Documentos; después consultá por las canaletas y su mantenimiento. Revisá las fuentes y versiones que acompañan la respuesta."
            : "La búsqueda documental está disponible. Las respuestas con IA son opcionales y necesitan que el responsable de la demo habilite el proveedor; el resto del recorrido funciona sin esa conexión."}
        </p>
        <Link
          className="demo-guide-link"
          to={target("DEMO-MOLINO", "documentos")}
        >
          Abrir documentos de prueba <FiArrowUpRight />
        </Link>
      </Panel>
      <Panel title="Archivos de práctica">
        <p>
          Descargá un rubrado válido para probar la importación y una factura
          ficticia para cargar en Documentos. Son ejemplos; no tienen validez
          fiscal ni reemplazan los documentos de una obra real.
        </p>
        <div className="actions">
          <button
            className="ghost"
            onClick={() =>
              download("/demo/materials/rubrado.xlsx", "rubrado-demo.xlsx")
            }
          >
            Descargar rubrado de prueba
          </button>
          <button
            className="ghost"
            onClick={() =>
              download("/demo/materials/factura.pdf", "factura-demo.pdf")
            }
          >
            Descargar factura ficticia
          </button>
        </div>
      </Panel>
    </>
  );
}
