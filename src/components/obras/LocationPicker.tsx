import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
export default function LocationPicker({
  latitude,
  longitude,
  onPick,
}: {
  latitude: string;
  longitude: string;
  onPick: (lat: string, lon: string) => void;
}) {
  const node = useRef<HTMLDivElement>(null);
  const initial = useRef({ latitude, longitude });
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  useEffect(() => {
    if (!node.current) return;
    const { latitude: lat, longitude: lon } = initial.current;
    const center: [number, number] =
      lat && lon ? [Number(lat), Number(lon)] : [-34.375, -55.24];
    const map = L.map(node.current).setView(center, 14);
    mapRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map);
    map.on("click", (e) => {
      onPick(e.latlng.lat.toFixed(7), e.latlng.lng.toFixed(7));
    });
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [onPick]);
  useEffect(() => {
    const map = mapRef.current;
    markerRef.current?.remove();
    markerRef.current = null;
    const lat = Number(latitude),
      lon = Number(longitude);
    if (
      map &&
      latitude &&
      longitude &&
      Number.isFinite(lat) &&
      Number.isFinite(lon) &&
      Math.abs(lat) <= 90 &&
      Math.abs(lon) <= 180
    ) {
      markerRef.current = L.circleMarker([lat, lon], { radius: 8 }).addTo(map);
    }
  }, [latitude, longitude]);
  return (
    <div>
      <p className="hint">
        Hacé clic en la ubicación de la intervención. El centro del mapa es sólo
        una referencia.
      </p>
      <div
        ref={node}
        className="location-picker"
        aria-label="Mapa para elegir ubicación"
      />
    </div>
  );
}
