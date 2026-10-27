import L from "leaflet";
import type { GeoJsonObject } from "geojson";
import type { Reference } from "./types";

/** Catalog adapters keep external geography independent of works and permissions. */
export function addGeographicLayers(map: L.Map, catalog: Reference["catalog"]) {
  const overlays: Record<string, L.Layer> = {};
  const controller = new AbortController();
  let active = true;
  const control = L.control.layers({}, overlays, {
    collapsed: !L.Browser.mobile,
  });
  const layers: L.Layer[] = [];
  const add = (layer: L.Layer, label: string) => {
    layers.push(layer);
    control.addOverlay(layer, label);
  };
  for (const entry of catalog.filter((c) => c.kind === "capa_geografica")) {
    if (entry.data.type === "wms" && entry.data.url) {
      add(
        L.tileLayer.wms(entry.data.url, {
          layers: entry.data.layers,
          format: "image/png",
          transparent: true,
          attribution: entry.data.attribution,
        }),
        entry.label,
      );
    } else if (entry.data.type === "geojson" && entry.data.url) {
      void fetch(entry.data.url, {
        credentials: "omit",
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) throw new Error("Capa no disponible");
          const raw = await response.text();
          if (raw.length > 5_000_000) throw new Error("Capa demasiado grande");
          const data: GeoJsonObject = JSON.parse(raw);
          if (
            !data ||
            ![
              "FeatureCollection",
              "Feature",
              "GeometryCollection",
              "Point",
              "MultiPoint",
              "LineString",
              "MultiLineString",
              "Polygon",
              "MultiPolygon",
            ].includes(data.type)
          )
            throw new Error("GeoJSON inválido");
          if (active)
            add(
              L.geoJSON(data, {
                attribution: entry.data.attribution,
                pointToLayer: (_feature, position) =>
                  L.circleMarker(position, {
                    radius: 5,
                    color: "#7557a8",
                    className: "geographic-marker",
                  }),
              }),
              entry.label,
            );
        })
        .catch(() => {
          /* An unavailable external layer leaves the base map usable. */
        });
    }
  }
  if (catalog.some((c) => c.kind === "capa_geografica")) control.addTo(map);
  return () => {
    active = false;
    controller.abort();
    control.remove();
    layers.forEach((layer) => layer.remove());
  };
}
