// Mala ugrađena karta trase linije (Leaflet). Lijeno se učitava gdje se koristi.
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import geometryJson from '@data/geometry.json';
import { stationById } from '@/lib/data';
import type { GeometryMap, Line, Direction } from '@/lib/types';

const GEOMETRY = geometryJson as unknown as GeometryMap;

export function RouteMap({
  line,
  dir,
  onStop,
}: {
  line: Line;
  dir: Direction;
  onStop?: (id: string) => void;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const onStopRef = useRef(onStop);
  onStopRef.current = onStop;

  useEffect(() => {
    if (!elRef.current || mapRef.current) return;
    const map = L.map(elRef.current, { zoomControl: false, attributionControl: true }).setView(
      [45.4885, 15.564],
      13,
    );
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 60);
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // nacrtaj trasu + stajališta za trenutnu liniju/smjer
  const layer = useRef<L.LayerGroup | null>(null);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    layer.current?.remove();
    const g = L.layerGroup().addTo(map);
    layer.current = g;

    const polys = GEOMETRY[line.id] ?? [];
    const bounds = L.latLngBounds([]);
    for (const pts of polys) {
      const pl = L.polyline(pts, { color: line.color, weight: 5, opacity: 0.85 }).addTo(g);
      bounds.extend(pl.getBounds());
    }
    for (const s of dir.stops) {
      const st = stationById(s.station);
      if (!st) continue;
      const m = L.marker([st.lat, st.lng], {
        icon: L.divIcon({ className: '', html: '<div class="stop-marker"></div>', iconSize: [16, 16], iconAnchor: [8, 8] }),
        title: st.name,
      }).addTo(g);
      m.on('click', () => onStopRef.current?.(s.station));
      bounds.extend([st.lat, st.lng]);
    }
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24] });
  }, [line.id, line.color, dir]);

  return <div className="route-map" ref={elRef} />;
}
