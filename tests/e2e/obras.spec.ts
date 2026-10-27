import {
  test,
  expect,
  type Page,
  type APIRequestContext,
} from "@playwright/test";

test("Dirección explora la guía y descarga archivos de práctica", async ({
  page,
}) => {
  await login(page, "general");
  await navigateSidebar(page, "Guía de la demo");
  await expect(
    page.getByRole("heading", { name: "Tu primer recorrido" }),
  ).toBeVisible();
  await expect(page.locator(".demo-guide-step")).toHaveCount(6);
  if (test.info().project.name === "mobile") {
    await page
      .getByRole("button", {
        name: "Cambiar al modo diurno celestial",
        exact: true,
      })
      .click();
  }
  await page.screenshot({
    path: `tmp/screenshots/${test.info().project.name}-guia-direccion.png`,
    fullPage: true,
  });
  const file = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Descargar rubrado de prueba" })
    .click();
  expect((await file).suggestedFilename()).toBe("rubrado-demo.xlsx");
  await page.getByRole("link", { name: "Ver obra y contrato" }).click();
  await expect(
    page.getByRole("heading", { name: "Molino · Ejecución Demo", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Asistente", exact: true }).click();
  const unavailable = page.getByText(
    "Las respuestas con IA no están habilitadas en esta instalación.",
    { exact: false },
  );
  if (await unavailable.isVisible())
    await expect(
      page.getByRole("button", { name: "Consultar con IA", exact: true }),
    ).toBeDisabled();
});

for (const account of ["empresa-a", "empresa-b"]) {
  test(`${account} completa un pago de demo sin cambiar de perfil`, async ({
    page,
    request,
  }) => {
    await login(page, account);
    await page.goto("/pagos");
    const created = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/payment-orders/example") &&
        response.request().method() === "POST",
    );
    await page
      .getByRole("button", { name: "Nuevo pago de prueba", exact: true })
      .click();
    const result = await created;
    expect(result.status()).toBe(201);
    const fixture = await result.json();
    const headers = await auth(request, account);
    const orders = await (
      await request.get("/api/payment-orders", { headers })
    ).json();
    const order = orders.orders.find(
      (row: { id: number }) => row.id === fixture.payment_id,
    );
    expect(order.can_pay).toBe(true);
    const card = page
      .locator("article.pay-order")
      .filter({ hasText: order.reference });
    await card
      .getByRole("button", { name: "Pagar en demo", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Confirmá tu pago.", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Confirmar transferencia", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Pago realizado.", exact: true }),
    ).toBeVisible();
    const downloaded = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Descargar comprobante", exact: true })
      .click();
    expect((await downloaded).suggestedFilename()).toBe(
      `comprobante-${order.reference}.pdf`,
    );
    await page
      .getByRole("link", { name: "Volver a pagos", exact: true })
      .last()
      .click();
    await expect(
      page.getByTitle(
        `Representante Empresa Demo ${account.endsWith("a") ? "A" : "B"} · Portal de empresa`,
        { exact: true },
      ),
    ).toBeVisible();
    await page.getByRole("tab", { name: /Historial/ }).click();
    await expect(
      page.locator("article.pay-order").filter({ hasText: order.reference }),
    ).toContainText("Pagado");
  });
}

async function login(page: Page, account: string) {
  await page.goto("/login");
  await page
    .getByLabel("Cuenta de prueba")
    .selectOption(`${account}@demo.invalid`);
  const code = page.getByLabel("Código de acceso a la demo", { exact: true });
  if (await code.isVisible())
    await code.fill(process.env.E2E_DEMO_ACCESS_CODE || "");
  await page
    .getByRole("button", {
      name: "Ingresar al espacio de trabajo",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Cada obra. Un futuro en marcha.",
      exact: true,
    }),
  ).toBeVisible();
}
async function switchRole(
  page: Page,
  account: string,
  work: number,
  tab: string,
) {
  await openMenu(page);
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await login(page, account);
  await page.goto(`/obras/${work}?tab=${tab}`);
}
async function openMenu(page: Page) {
  const toggle = page.getByRole("button", {
    name: "Abrir menú principal",
    exact: true,
  });
  if (await toggle.isVisible()) await toggle.click();
}
async function navigateSidebar(page: Page, name: string | RegExp) {
  await openMenu(page);
  await page
    .getByRole("navigation", { name: "Principal" })
    .getByRole("link", { name, exact: true })
    .click();
}
async function auth(request: APIRequestContext, account: string) {
  const r = await request.post("/api/auth/login", {
    data: {
      account: `${account}@demo.invalid`,
      access_code: process.env.E2E_DEMO_ACCESS_CODE || "",
    },
  });
  expect(r.ok()).toBeTruthy();
  return { Authorization: `Bearer ${(await r.json()).token}` };
}
async function bootstrap(request: APIRequestContext) {
  const headers = await auth(request, "admin");
  const reference = await (
    await request.get("/api/reference", { headers })
  ).json();
  const created = await request.post("/api/works", {
    headers,
    data: {
      name: `Circuito navegador ${Date.now()}`,
      description: "Proyecto sintético para E2E",
      locality: "Minas",
    },
  });
  expect(created.status()).toBe(201);
  const work = (await created.json()).work;
  for (const role of ["director_obra", "tecnico", "inspector"]) {
    const user = reference.users.find((u: { role: string }) => u.role === role);
    expect(
      (
        await request.post(`/api/works/${work.id}/actors`, {
          headers,
          data: { user_id: user.id, role },
        })
      ).status(),
    ).toBe(201);
  }
  const company = reference.companies.find(
    (c: { name: string }) => c.name === "Empresa Demo A",
  );
  const c = await request.post(`/api/works/${work.id}/contracts`, {
    headers,
    data: {
      kind: "contractual",
      company_id: company.id,
      number: "DEMO-E2E",
      start_date: "2026-01-01",
      end_date: "2027-12-31",
      rules: { iva_rate: "0.22", social_payment: "separado" },
      lines: [
        {
          code: "1",
          description: "Rubro sintético",
          quantity: "10",
          unit_price: "100",
          unit: "m2",
        },
      ],
    },
  });
  expect(c.status()).toBe(201);
  const contract = (await c.json()).contract;
  expect(
    (
      await request.post(
        `/api/works/${work.id}/contracts/${contract.id}/approve`,
        { headers },
      )
    ).ok(),
  ).toBeTruthy();
  const schedule = await (
    await request.post(`/api/works/${work.id}/schedules`, {
      headers,
      data: {
        kind: "contractual",
        activities: [
          {
            title: "Preparación",
            start: "2026-01-01",
            end: "2027-12-31",
            responsible_id: reference.users.find(
              (u: { role: string }) => u.role === "director_obra",
            ).id,
          },
        ],
      },
    })
  ).json();
  expect(
    (
      await request.post(
        `/api/works/${work.id}/schedules/${schedule.schedule.id}/approve`,
        { headers },
      )
    ).ok(),
  ).toBeTruthy();
  expect(
    (
      await request.post(`/api/works/${work.id}/transition`, {
        headers,
        data: { version: work.version, stage: "obra" },
      })
    ).ok(),
  ).toBeTruthy();
  const known = await (
    await request.get("/api/works?q=Molino", { headers })
  ).json();
  const molino = known.works.find(
    (w: { code: string }) => w.code === "DEMO-MOLINO",
  );
  const documents = await (
    await request.get(`/api/works/${molino.id}/documents`, { headers })
  ).json();
  const pdfDoc = documents.documents.find(
    (d: { mime: string }) => d.mime === "application/pdf",
  );
  const pdf = await (
    await request.get(`/api/documents/${pdfDoc.id}/download`, { headers })
  ).body();
  return { work, headers, pdf };
}

for (const account of [
  "admin",
  "general",
  "director",
  "tecnico",
  "inspector",
  "administrativo",
  "consulta",
  "empresa-a",
  "empresa-b",
])
  test(`Cuenta ${account}: sesión, navegación y persistencia`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("response", (r) => {
      if (r.status() >= 500) errors.push(`${r.status()} ${r.url()}`);
    });
    await login(page, account);
    await page.reload();
    await expect(
      page.getByRole("heading", {
        name: "Cada obra. Un futuro en marcha.",
        exact: true,
      }),
    ).toBeVisible();
    await navigateSidebar(page, "Intervenciones");
    await expect(
      page.getByRole("heading", { name: "Intervenciones", exact: true }),
    ).toBeVisible();
    const links = page.locator("tbody td:first-child a");
    if (await links.count()) {
      await links.first().click();
      for (const tab of [
        "Documentos",
        "Rubrado y contrato",
        "Cronograma",
        "Informes y pendientes",
        "Certificación y pago",
        "Trámites",
        "Asistente",
        "Historial",
      ]) {
        await page.getByRole("tab", { name: tab, exact: true }).click();
        await expect(page.locator("main")).not.toContainText(
          "No se pudo completar la operación",
        );
      }
      await page.screenshot({
        path: `tmp/screenshots/${info.project.name}-${account}.png`,
        fullPage: true,
      });
    }
    for (const [path, title] of [
      ["/bandeja", "Bandeja de trabajo"],
      ["/pagos", "Pagos"],
    ]) {
      await page.goto(path);
      await expect(
        page.getByRole("heading", { name: title, exact: true }),
      ).toBeVisible();
      await expect(page.locator("main")).not.toContainText(
        "No se pudo completar la operación",
      );
    }
    if (
      ["admin", "general", "administrativo", "empresa-a", "empresa-b"].includes(
        account,
      )
    ) {
      await page.goto("/empresas");
      await expect(
        page.getByRole("heading", {
          name: account.startsWith("empresa-") ? "Mi empresa" : "Empresas",
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", {
          name: "Representantes y vigencia",
          exact: true,
        }),
      ).toBeVisible();
    }
    expect(errors).toEqual([]);
    await openMenu(page);
    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(
      page.getByRole("heading", { name: "Ingresar al sistema" }),
    ).toBeVisible();
  });

test("Alta de intervención desde ficha y recarga", async ({ page }) => {
  await login(page, "tecnico");
  await page
    .getByRole("region", { name: /Cada obra/ })
    .getByRole("button", { name: "Nueva intervención", exact: true })
    .click();
  const name = `Alta UI ${Date.now()}`;
  await page.getByLabel("Nombre", { exact: true }).fill(name);
  await page.getByLabel("Ubicación / dirección").fill("Ubicación ficticia");
  await page
    .getByLabel("Descripción / objeto")
    .fill("Objeto creado desde interfaz para probar persistencia");
  await expect(page.getByLabel("Latitud", { exact: true })).toHaveValue("");
  await page
    .getByRole("button", { name: "Elegir ubicación en el mapa" })
    .click();
  await page
    .locator(".location-picker")
    .click({ position: { x: 140, y: 110 } });
  await expect(page.getByLabel("Latitud", { exact: true })).not.toHaveValue("");
  await page.getByRole("button", { name: "Dejar sin coordenadas" }).click();
  await expect(
    page.locator(".location-picker .leaflet-interactive"),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Ocultar mapa de ubicación" }).click();
  await page
    .getByRole("button", { name: "Agregar fuente de financiación" })
    .click();
  await page
    .getByLabel("Fuente de financiación 1", { exact: true })
    .fill("Financiación A E2E");
  await page.getByLabel("Monto de financiación 1 (UYU)").fill("120.50");
  await page
    .getByRole("button", { name: "Agregar fuente de financiación" })
    .click();
  await page
    .getByLabel("Fuente de financiación 2", { exact: true })
    .fill("Financiación B E2E");
  await page.getByLabel("Monto de financiación 2 (UYU)").fill("50");
  await page.getByRole("button", { name: "Guardar ficha" }).click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await expect(
    page.getByText("Sin coordenadas", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Editar ficha", exact: true }).click();
  await expect(
    page.getByLabel("Fuente de financiación 2", { exact: true }),
  ).toHaveValue("Financiación B E2E");
  await page
    .getByRole("button", { name: "Guardar ficha", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Guardar ficha", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("tab", { name: "Equipo y actores" }).click();
  await expect(
    page.getByRole("heading", { name: "Técnica de Proyecto Demo" }),
  ).toBeVisible();
});

test("Trámite documental, derivación, subsanación y bandeja", async ({
  page,
  request,
}, info) => {
  const { work, headers, pdf } = await bootstrap(request);
  const title = `Revisión documental E2E ${Date.now()}`;
  const companyHeaders = await auth(request, "empresa-a");
  const docResponse = await request.post(`/api/works/${work.id}/documents`, {
    headers: companyHeaders,
    multipart: {
      kind: "informe",
      file: {
        name: "plano-tramite-e2e.pdf",
        mimeType: "application/pdf",
        buffer: pdf,
      },
    },
  });
  expect(docResponse.status()).toBe(201);
  const doc = (await docResponse.json()).document;
  await login(page, "empresa-a");
  await page.goto(`/obras/${work.id}?tab=tramites`);
  await page
    .getByRole("button", { name: "Nuevo trámite", exact: true })
    .click();
  await page.getByLabel("Asunto del trámite").fill(title);
  await page
    .getByLabel("Solicitud documental")
    .fill("Revisar el plano de demostración");
  await page
    .getByLabel("Adjuntos documentales", { exact: true })
    .selectOption(String(doc.id));
  await page
    .getByRole("button", { name: "Guardar borrador de trámite" })
    .click();
  const transition = async (status: string, comment: string) => {
    await page.getByLabel("Siguiente actuación").selectOption(status);
    await page.getByLabel("Actuación del trámite").fill(comment);
    await page
      .getByRole("button", { name: "Registrar actuación del trámite" })
      .click();
  };
  await transition("ingresado", "Presentación de prueba");
  await expect(page.locator(".badge.ingresado")).toBeVisible();
  await switchRole(page, "admin", work.id, "tramites");
  await page
    .getByText("Destino del pase entre unidades", { exact: true })
    .click();
  const reference = await (
    await request.get("/api/reference", { headers })
  ).json();
  const director = reference.users.find(
    (u: { role: string }) => u.role === "director_obra",
  );
  await page
    .getByLabel("Unidad de destino")
    .selectOption(String(director.unit_id));
  await page
    .getByLabel("Responsable de destino")
    .selectOption(String(director.id));
  await transition("derivar", "Pase al director responsable");
  await switchRole(page, "director", work.id, "tramites");
  await transition("en_revision", "Inicio de revisión documental");
  await transition("observado", "Solicitar detalle complementario");
  await expect(page.locator(".badge.observado")).toBeVisible();
  await switchRole(page, "empresa-a", work.id, "tramites");
  await transition("subsanado", "Aclaración y documentación de respaldo");
  await transition("ingresado", "Reingreso para revisión");
  await switchRole(page, "director", work.id, "tramites");
  await transition("en_revision", "Revisión de la subsanación");
  await transition("aprobado", "Conformidad documental de demostración");
  await transition("archivado", "Archivo del trámite completado");
  await expect(page.locator(".badge.archivado")).toBeVisible();
  await navigateSidebar(page, /Bandeja de trabajo/);
  await page.getByLabel("Sólo abiertos").uncheck();
  await page.getByLabel("Buscar en la bandeja").fill(title);
  await expect(
    page.getByRole("link", { name: new RegExp(title) }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Notificaciones/ }),
  ).toBeVisible();
  await page.screenshot({
    path: `tmp/screenshots/${info.project.name}-bandeja-tramites.png`,
    fullPage: true,
  });
});

test("Mapa, filtros, navegación y capa GeoJSON pública", async ({
  page,
  request,
}, info) => {
  const headers = await auth(request, "admin");
  const label = `Capa GeoJSON E2E ${Date.now()}`;
  const response = await request.post("/api/admin/catalog", {
    headers,
    data: {
      kind: "capa_geografica",
      code: `E2E-${Date.now()}`,
      label,
      data: {
        type: "geojson",
        url: "/api/public/geojson",
        attribution: "Datos públicos demo",
      },
    },
  });
  expect(response.status()).toBe(201);
  const item = (await response.json()).item;
  const mapData = await (
    await request.get("/api/works/map", { headers })
  ).json();
  const markerCount = mapData.works.filter(
    (w: { latitude: string | null; longitude: string | null }) =>
      w.latitude !== null && w.longitude !== null,
  ).length;
  try {
    await login(page, "admin");
    await expect(page.locator(".work-marker")).toHaveCount(markerCount);
    if (info.project.name === "desktop") {
      const layersToggle = page.locator(".leaflet-control-layers-toggle");
      if (await layersToggle.isVisible())
        await layersToggle.press("Enter", { timeout: 8000 });
    }
    const layerCheckbox = page.getByRole("checkbox", {
      name: label,
      exact: true,
    });
    await expect(layerCheckbox).toBeVisible();
    await layerCheckbox.focus({ timeout: 8000 });
    await layerCheckbox.press("Space", { timeout: 8000 });
    await expect(layerCheckbox).toBeChecked();
    await navigateSidebar(page, "Intervenciones");
    await page.getByLabel("Buscar", { exact: true }).fill("Molino");
    await expect(page.locator("tbody tr")).toHaveCount(1);
    await expect(
      page
        .locator(".metric")
        .filter({ hasText: "Intervenciones" })
        .locator("strong"),
    ).toHaveText("1");
    // The redesigned overview and work list share server filters through their URL.
    await page.goto("/?q=Molino");
    await expect(page.locator(".work-marker")).toHaveCount(1);
    await page.locator(".work-marker").click();
    await page
      .getByRole("button", { name: "Abrir ficha", exact: true })
      .click();
    await expect(
      page.getByRole("heading", {
        name: "Molino · Ejecución Demo",
        exact: true,
      }),
    ).toBeVisible();
    await page.goto("/publico", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", {
        name: "Obras en el territorio",
        exact: true,
      }),
    ).toBeVisible();
    const publicData = await (await request.get("/api/public/geojson")).json();
    expect(publicData.type).toBe("FeatureCollection");
    for (const feature of publicData.features)
      expect(feature.properties.company_id).toBeUndefined();
  } finally {
    expect(
      (
        await request.patch(`/api/admin/catalog/${item.id}`, {
          headers,
          data: { active: false },
        })
      ).ok(),
    ).toBeTruthy();
  }
});

test("Plano PDF: vista móvil, anotación persistente, nueva versión y exportación", async ({
  page,
  request,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const { work, pdf } = await bootstrap(request);
  await login(page, "tecnico");
  await page.goto(`/obras/${work.id}?tab=documentos`);
  await page.getByLabel(/Archivo \(PDF/).setInputFiles({
    name: "plano-e2e-demo.pdf",
    mimeType: "application/pdf",
    buffer: pdf,
  });
  await page.getByRole("button", { name: "Subir archivo" }).click();
  await expect(
    page.getByText("plano-e2e-demo.pdf", { exact: true }).first(),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Ver plano-e2e-demo.pdf v1", exact: true })
    .click();
  const canvas = page.getByRole("img", { name: "Página 1 del documento PDF" });
  await expect(canvas).toBeVisible();
  const renderedPixels = async () =>
    canvas.evaluate((el) => {
      const c = el as HTMLCanvasElement;
      const pixels = c
        .getContext("2d")!
        .getImageData(0, 0, c.width, c.height).data;
      let dark = 0;
      for (let i = 0; i < pixels.length; i += 4)
        if (
          pixels[i + 3] > 0 &&
          pixels[i] < 150 &&
          pixels[i + 1] < 150 &&
          pixels[i + 2] < 150
        )
          dark++;
      return dark;
    });
  await expect.poll(renderedPixels).toBeGreaterThan(1000);
  await expect
    .poll(async () =>
      Number(await canvas.evaluate((el) => (el as HTMLCanvasElement).width)),
    )
    .toBeGreaterThan(500);
  await page
    .getByRole("button", { name: "Anotar posición", exact: true })
    .click();
  const box = await page.locator(".viewer").boundingBox();
  expect(box).not.toBeNull();
  await page
    .locator(".viewer")
    .click({ position: { x: box!.width * 0.5, y: box!.height * 0.3 } });
  await page
    .getByLabel("Texto de la anotación")
    .fill("Detalle técnico de prueba, versión uno");
  await page.getByRole("button", { name: "Guardar anotación" }).click();
  await expect(
    page.getByText("Detalle técnico de prueba, versión uno", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cerrar visor" }).click();
  await page
    .getByRole("button", { name: "Nueva versión", exact: true })
    .click();
  await page.getByLabel(/Archivo \(PDF/).setInputFiles({
    name: "plano-e2e-demo.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.concat([
      pdf,
      Buffer.from("\n% Revision sintetica de prueba\n"),
    ]),
  });
  await page.getByRole("button", { name: "Subir archivo" }).click();
  await page
    .getByRole("button", { name: "Ver plano-e2e-demo.pdf v1", exact: true })
    .click();
  await expect(
    page.getByText("Detalle técnico de prueba, versión uno", { exact: true }),
  ).toBeVisible();
  await expect(canvas).toBeVisible();
  await expect.poll(renderedPixels).toBeGreaterThan(1000);
  await page.screenshot({
    path: `tmp/screenshots/${info.project.name}-plano-anotado.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Cerrar visor" }).click();
  await page.getByRole("tab", { name: "Rubrado y contrato" }).click();
  const d = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Exportar xlsx", exact: true })
    .click();
  expect((await d).suggestedFilename()).toContain(".xlsx");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("Certificación: empresa, observación, subsanación, factura, aprobación, expediente y pago", async ({
  page,
  request,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const { work, pdf } = await bootstrap(request);
  await login(page, "empresa-a");
  await page.goto(`/obras/${work.id}?tab=certificados`);
  await page.getByRole("button", { name: "Iniciar certificación" }).click();
  await page.getByLabel("Avance 1", { exact: true }).fill("25");
  await page.getByRole("button", { name: "Calcular y verificar" }).click();
  await page.getByRole("button", { name: "Guardar borrador" }).click();
  await page.getByRole("button", { name: "Presentar avance" }).click();
  await expect(page.locator(".badge.presentado")).toBeVisible();
  await switchRole(page, "director", work.id, "certificados");
  await page
    .getByLabel("Devolver con observación")
    .fill("Ajustar medición a 30%");
  await page.getByRole("button", { name: "Registrar observación" }).click();
  await expect(page.locator(".badge.observado")).toBeVisible();
  await switchRole(page, "empresa-a", work.id, "certificados");
  await page.getByRole("button", { name: "Editar / subsanar" }).click();
  await page.getByLabel("Avance 1", { exact: true }).fill("30");
  await page.getByRole("button", { name: "Calcular y verificar" }).click();
  await page.getByRole("button", { name: "Guardar subsanación" }).click();
  await expect(page.getByRole("heading", { name: /Revisión 2/ })).toBeVisible();
  await page.getByRole("button", { name: "Presentar avance" }).click();
  await expect(page.locator(".badge.presentado")).toBeVisible();
  await switchRole(page, "director", work.id, "certificados");
  await page.getByRole("button", { name: "Aprobar inicialmente" }).click();
  await expect(page.locator(".badge.aprobacion_inicial")).toBeVisible();
  await switchRole(page, "empresa-a", work.id, "documentos");
  await page.getByLabel(/Archivo \(PDF/).setInputFiles({
    name: "factura-e2e-demo.pdf",
    mimeType: "application/pdf",
    buffer: pdf,
  });
  await page
    .getByRole("combobox", { name: "Tipo", exact: true })
    .selectOption("factura");
  await page.getByRole("button", { name: "Subir archivo" }).click();
  await expect(
    page.getByText("factura-e2e-demo.pdf", { exact: true }).first(),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Certificación y pago" }).click();
  await page
    .getByRole("combobox", { name: "Factura PDF", exact: true })
    .selectOption({ label: "factura-e2e-demo.pdf · v1" });
  await page.getByLabel("Número de factura").fill("DEMO-E2E-001");
  await page
    .getByRole("button", {
      name: "Vincular factura y enviar a Dirección General",
    })
    .click();
  await switchRole(page, "general", work.id, "certificados");
  await page.getByRole("button", { name: "Aprobar definitivamente" }).click();
  const downloadEvent = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Certificación PDF", exact: true })
    .click();
  const file = await downloadEvent;
  expect(file.suggestedFilename()).toContain(".pdf");
  await switchRole(page, "administrativo", work.id, "certificados");
  await page
    .getByLabel("Actuación para pase a hacienda")
    .fill("Disponibilidad demo verificada");
  await page
    .getByLabel("Disponibilidad presupuestal verificada en demo")
    .check();
  await page
    .getByRole("button", { name: "Registrar pase a hacienda", exact: true })
    .click();
  await page
    .getByLabel("Actuación para pase a secretaria general")
    .fill("Pase administrativo sintético");
  await page
    .getByRole("button", {
      name: "Registrar pase a secretaria general",
      exact: true,
    })
    .click();
  await switchRole(page, "general", work.id, "certificados");
  await page
    .getByLabel("Actuación para pase a resolucion")
    .fill("Resolución de demostración, sin firma institucional");
  await page.getByLabel("factura-e2e-demo.pdf · v1", { exact: true }).check();
  await page
    .getByRole("button", { name: "Registrar pase a resolucion", exact: true })
    .click();
  await switchRole(page, "administrativo", work.id, "certificados");
  await page
    .getByLabel("Actuación para pase a contaduria tesoreria")
    .fill("Control y pase de demostración");
  await page
    .getByRole("button", {
      name: "Registrar pase a contaduria tesoreria",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Abrir pasarela", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Confirmá tu pago." }),
  ).toBeVisible();
  await page.getByLabel("Cuenta de origen").selectOption("sin_saldo");
  await page.getByRole("button", { name: "Confirmar transferencia" }).click();
  await expect(
    page.getByText("Saldo insuficiente en la cuenta de prueba."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Intentar nuevamente" }).click();
  await expect(
    page.getByRole("heading", { name: "Confirmá tu pago." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Confirmar transferencia" }).click();
  await expect(
    page.getByRole("heading", { name: "Pago realizado." }),
  ).toBeVisible();
  const receiptEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Descargar comprobante" }).click();
  expect((await receiptEvent).suggestedFilename()).toContain(
    "comprobante-DEMO-",
  );
  await page.goto(`/obras/${work.id}?tab=certificados`);
  await expect(page.locator(".badge.pagado")).toBeVisible();
  await page.getByRole("tab", { name: "Ficha", exact: true }).click();
  await expect(
    page.locator(".metric").filter({ hasText: "Avance físico ponderado" }),
  ).toContainText("30.00%");
  await expect(
    page.locator(".metric").filter({ hasText: "Pagos ficticios registrados" }),
  ).toContainText("366");
  await page.screenshot({
    path: `tmp/screenshots/${info.project.name}-circuito-completo.png`,
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
