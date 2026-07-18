// Karta linija i stanica (Leaflet + OpenStreetMap). Učitava se lijeno (vidi App.tsx).
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp } from '@/state/AppState';
import { LINES, STATIONS, stationById } from '@/lib/data';
import { departuresAt } from '@/lib/schedule';
import { DepartureRow } from '@/components/common';
import { Back, Chevron, Close } from '@/lib/icons';

function lineColor(id: number): string {
  return getComputedStyle(document.documentElement).getPropertyValue('--pk-line-' + id).trim();
}

export function MapScreen() {
  const {
    mapFilter,
    setMapFilter,
    mapSelected,
    setMapSelected,
    schedType,
    effNow,
    openStation,
    goBack,
  } = useApp();

  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markers = useRef<Record<string, L.Marker>>({});
  const routes = useRef<Record<number, L.Polyline>>({});
  const onSelect = useRef<(id: string | null) => void>(() => {});
  onSelect.current = setMapSelected;

  // init jednom
  useEffect(() => {
    if (!elRef.current || mapRef.current) return;
    const map = L.map(elRef.current, { zoomControl: false, attributionControl: true }).setView(
      [45.4885, 15.564],
      14,
    );
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    for (const line of LINES) {
      const pts = line.stops.map((s) => {
        const st = stationById(s.station)!;
        return [st.lat, st.lng] as [number, number];
      });
      routes.current[line.id] = L.polyline(pts, {
        color: lineColor(line.id),
        weight: 5,
        opacity: 0.75,
        lineJoin: 'round',
        lineCap: 'round',
      }).addTo(map);
    }

    for (const st of STATIONS) {
      const m = L.marker([st.lat, st.lng], {
        icon: L.divIcon({
          className: '',
          html: `<div class="stop-marker"></div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        }),
        keyboard: true,
        title: st.name,
        alt: 'Stanica ' + st.name,
      }).addTo(map);
      m.on('click', () => onSelect.current(st.id));
      markers.current[st.id] = m;
    }

    map.on('click', () => onSelect.current(null));
    mapRef.current = map;

    // Leaflet mora preračunati dimenzije nakon što view postane vidljiv
    setTimeout(() => map.invalidateSize(), 60);

    return () => {
      map.remove();
      mapRef.current = null;
      markers.current = {};
      routes.current = {};
    };
  }, []);

  // filtar linija
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const line of LINES) {
      const show = mapFilter === 0 || mapFilter === line.id;
      routes.current[line.id]?.setStyle({
        opacity: show ? (mapFilter === 0 ? 0.55 : 0.9) : 0.08,
        weight: show && mapFilter !== 0 ? 6 : 5,
      });
    }
    for (const st of STATIONS) {
      const onLine =
        mapFilter === 0 ||
        LINES.find((l) => l.id === mapFilter)?.stops.some((s) => s.station === st.id);
      const el = markers.current[st.id]?.getElement();
      if (el) el.style.opacity = onLine ? '1' : '.25';
    }
    if (mapFilter !== 0) {
      const r = routes.current[mapFilter];
      if (r) map.fitBounds(r.getBounds(), { padding: [56, 56] });
    }
  }, [mapFilter]);

  // istaknuta stanica
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const [id, m] of Object.entries(markers.current)) {
      const el = m.getElement()?.querySelector('.stop-marker');
      if (el) el.classList.toggle('sel', mapSelected === id);
    }
    if (mapSelected) {
      const st = stationById(mapSelected);
      if (st) map.panTo([st.lat, st.lng]);
    }
  }, [mapSelected]);

  const selected = stationById(mapSelected);
  const now = effNow();
  const deps = selected ? departuresAt(selected.id, schedType, now, 2) : [];

  return (
    <div className="view-map">
      <div className="map-el" ref={elRef} />

      <div className="map-top">
        <button className="map-back" onClick={goBack}>
          <Back /> Natrag
        </button>
        <div className="map-filters">
          <button
            className="chip"
            aria-pressed={mapFilter === 0}
            onClick={() => setMapFilter(0)}
          >
            Sve linije
          </button>
          {LINES.map((l) => (
            <button
              key={l.id}
              className="chip"
              aria-pressed={mapFilter === l.id}
              aria-label={`Linija ${l.id}`}
              onClick={() => setMapFilter(l.id)}
            >
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 99,
                  background: `var(--pk-line-${l.id})`,
                }}
              />{' '}
              {l.id}
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div className="map-card">
          <div className="head">
            <h3>{selected.name}</h3>
            <button className="close" aria-label="Zatvori" onClick={() => setMapSelected(null)}>
              <Close />
            </button>
          </div>
          {deps.length ? (
            <ul className="dep-list flat">
              {deps.map((d, i) => (
                <li key={i}>
                  <DepartureRow dep={d} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="subtitle" style={{ marginTop: 6 }}>
              Nema više polazaka danas.
            </p>
          )}
          <button className="btn btn-primary" onClick={() => openStation(selected.id)}>
            Svi polasci <Chevron />
          </button>
        </div>
      )}
    </div>
  );
}
