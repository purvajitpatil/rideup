import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";

const icon = (cls) => L.divIcon({ className: "", html: `<div class="pin ${cls}"></div>`, iconSize: [22, 22], iconAnchor: [11, 11] });
const ICONS = { pickup: icon("pin-dot"), destination: icon("pin-square"), captain: icon("pin-car") };

// Keep the trip visible next to the panel (left panel on desktop, bottom sheet on phones)
function Fit({ points }) {
  const map = useMap();
  const key = JSON.stringify(points);
  useEffect(() => {
    const wide = window.innerWidth >= 820;
    const opts = wide
      ? { paddingTopLeft: [440, 60], paddingBottomRight: [60, 60], maxZoom: 16 }
      : { paddingTopLeft: [40, 80], paddingBottomRight: [40, Math.round(window.innerHeight * 0.45)], maxZoom: 16 };
    if (points.length > 1) map.fitBounds(points, opts);
    else if (points.length === 1) map.setView(points[0], 15);
  }, [key]);
  return null;
}

export default function MapView({ pickup, destination, captain, route = [] }) {
  const pts = [pickup, destination, captain].filter(Boolean).map((p) => [p.ltd, p.lng]);
  return (
    <MapContainer className="map" center={[19.03, 73.03]} zoom={12} zoomControl={false} attributionControl={true}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      {route.length > 1 && <Polyline positions={route} pathOptions={{ color: "#000", weight: 5, opacity: 0.9 }} />}
      {pickup && <Marker position={[pickup.ltd, pickup.lng]} icon={ICONS.pickup} />}
      {destination && <Marker position={[destination.ltd, destination.lng]} icon={ICONS.destination} />}
      {captain && <Marker position={[captain.ltd, captain.lng]} icon={ICONS.captain} />}
      <Fit points={pts} />
    </MapContainer>
  );
}
