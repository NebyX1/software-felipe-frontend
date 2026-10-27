import { Component, type ReactNode } from "react";

export default class PageBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="app-recovery" role="alert">
        <div className="eyebrow">RECUPERAR LA PANTALLA</div>
        <h1>No pudimos abrir esta pantalla.</h1>
        <p>
          Recargá la aplicación para volver a intentarlo. Los datos guardados se
          conservan.
        </p>
        <button onClick={() => window.location.reload()}>
          Recargar aplicación
        </button>
      </main>
    );
  }
}
