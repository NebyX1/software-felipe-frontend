import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Toaster } from "react-hot-toast";
import ObrasLayout from "../layouts/ObrasLayout";
import Login from "../pages/obras/Login";
import Dashboard from "../pages/obras/Dashboard";
import Public from "../pages/obras/Public";
import { ThemeProvider } from "../domain/theme";
import VersionNotice from "../components/obras/VersionNotice";
import PageBoundary from "../components/obras/PageBoundary";
const WorkDetail = lazy(() => import("../pages/obras/WorkDetail"));
const Administration = lazy(() => import("../pages/obras/Administration"));
const Payments = lazy(() => import("../pages/obras/Payments"));
const Checkout = lazy(() => import("../pages/obras/Checkout"));
const Inbox = lazy(() => import("../pages/obras/Inbox"));
const DemoGuide = lazy(() => import("../pages/obras/DemoGuide"));
const Companies = lazy(() => import("../pages/obras/Companies"));
export default function WorkRouter() {
  return (
    <ThemeProvider>
      <VersionNotice />
      <BrowserRouter>
        <PageBoundary>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/publico" element={<Public />} />
            <Route
              path="/pasarela/:id"
              element={
                <Suspense fallback={<p role="status">Abriendo pasarela…</p>}>
                  <Checkout />
                </Suspense>
              }
            />
            <Route element={<ObrasLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="/obras" element={<Dashboard listOnly />} />
              <Route
                path="/guia-demo"
                element={
                  <Suspense fallback={<p role="status">Abriendo guía…</p>}>
                    <DemoGuide />
                  </Suspense>
                }
              />
              <Route
                path="/pagos"
                element={
                  <Suspense fallback={<p role="status">Cargando pagos…</p>}>
                    <Payments />
                  </Suspense>
                }
              />
              <Route
                path="/bandeja"
                element={
                  <Suspense fallback={<p role="status">Cargando bandeja…</p>}>
                    <Inbox />
                  </Suspense>
                }
              />
              <Route
                path="/empresas"
                element={
                  <Suspense fallback={<p role="status">Cargando empresas…</p>}>
                    <Companies />
                  </Suspense>
                }
              />
              <Route
                path="/obras/:id"
                element={
                  <Suspense
                    fallback={<p role="status">Cargando intervención…</p>}
                  >
                    <WorkDetail />
                  </Suspense>
                }
              />
              <Route
                path="/administracion"
                element={
                  <Suspense
                    fallback={<p role="status">Cargando administración…</p>}
                  >
                    <Administration />
                  </Suspense>
                }
              />
              <Route
                path="*"
                element={
                  <p>
                    No encontramos esta página. <a href="/">Volver al panel</a>
                  </p>
                }
              />
            </Route>
          </Routes>
        </PageBoundary>
        <Toaster position="bottom-right" />
      </BrowserRouter>
    </ThemeProvider>
  );
}
