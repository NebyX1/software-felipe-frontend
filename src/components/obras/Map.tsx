import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";
import type { Work, Reference } from "../../domain/types";
import { useApi } from "../../domain/hooks";
import { addGeographicLayers } from "../../domain/geography";
import { useTheme } from "../../domain/theme";

export default function WorksMap({
  works,
  publicView = false,
}: {
  works: Work[];
  publicView?: boolean;
}) {
  const element = useRef<HTMLDivElement>(null);
  const instance = useRef<L.Map | null>(null);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const reference = useApi<Reference>("/reference", !publicView);
  const catalog = reference.data?.catalog;
  useEffect(() => {
    if (!element.current) return;
    const map = L.map(element.current, {
      zoomAnimation: false,
      fadeAnimation: false,
      markerZoomAnimation: false,
    }).setView([-34.375, -55.24], 9);
    instance.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);
    return () => {
      instance.current = null;
      map.stop();
      map.remove();
    };
  }, []);
  useEffect(() => {
    if (instance.current)
      return addGeographicLayers(instance.current, catalog || []);
  }, [catalog]);
  useEffect(() => {
    const map = instance.current;
    if (!map) return;
    const markers = L.layerGroup().addTo(map);
    const bounds: L.LatLngTuple[] = [];
    for (const w of works) {
      if (w.latitude == null || w.longitude == null) continue;
      const point: L.LatLngTuple = [Number(w.latitude), Number(w.longitude)];
      bounds.push(point);
      const content = document.createElement("div");
      const strong = document.createElement("strong");
      strong.textContent = w.name;
      content.append(strong);
      const detail = document.createElement("p");
      detail.textContent = w.locality + " · " + w.stage;
      content.append(detail);
      if (!publicView) {
        const button = document.createElement("button");
        button.textContent = "Abrir ficha";
        button.onclick = () => navigate("/obras/" + w.id);
        content.append(button);
      }
      L.circleMarker(point, {
        className: "work-marker",
        radius: 9,
        color: "white",
        weight: 2,
        fillColor:
          (theme === "neon"
            ? { proyecto: "#ff654e", obra: "#f5b467", posobra: "#81b8a0" }
            : { proyecto: "#6376ed", obra: "#c299e4", posobra: "#5eaeba" })[
            w.stage
          ] || "#687d90",
        fillOpacity: 1,
      })
        .addTo(markers)
        .bindPopup(content);
    }
    if (bounds.length > 1)
      map.fitBounds(bounds, { padding: [32, 32], maxZoom: 14 });
    else if (bounds.length) map.setView(bounds[0], 13, { animate: false });
    return () => {
      markers.remove();
    };
  }, [works, navigate, publicView, theme]);
  return (
    <div className="map-frame">
      <div
        ref={element}
        role="region"
        aria-label="Mapa de intervenciones"
        className="works-map"
      />
      <div className="map-legend">
        <span>
          <i className="proyecto" />
          Proyecto
        </span>
        <span>
          <i className="obra" />
          Obra
        </span>
        <span>
          <i className="posobra" />
          Posobra
        </span>
      </div>
    </div>
  );
}
