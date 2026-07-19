// Karta linija i stanica (Leaflet + OpenStreetMap). Učitava se lijeno (vidi App.tsx).
// Trase se crtaju po stvarnoj geometriji (po cesti) iz podataka, ne pravocrtno.
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp } from '@/state/AppState';
import { LINES, STATIONS, stationById } from '@/lib/data';
import { departuresAt } from '@/lib/schedule';
import { DepartureRow } from '@/components/common';
import { Back, Chevron, Close } from '@/lib/icons';
import geometryJson from '@data/geometry.json';
import type { GeometryMap, Line } from '@/lib/types';

/** Krajevi linije "a → b" (prva varijanta, smjer tamo) za oznaku na filteru. */
function lineEnds(line: Line): string {
  const st = line.variants[0]?.forward.stops ?? [];
  const a = stationById(st[0]?.station)?.name ?? '';
  const b = stationById(st[st.length - 1]?.station)?.name ?? '';
  return a && b ? `${a} → ${b}` : '';
}

// Geometrija trasa (po cesti) — velika, zato je u zasebnom fileu koji se bundle-a samo u
// ovaj (lijeno učitani) chunk karte.
const GEOMETRY = geometryJson as unknown as GeometryMap;

/** Sve poligonalne trase jedne linije. Fallback: spoji stajališta ako trasa nedostaje. */
function lineGeometries(line: (typeof LINES)[number]): [number, number][][] {
  const g = GEOMETRY[line.id];
  if (g && g.length) return g;
  const out: [number, number][][] = [];
  for (const v of line.variants) {
    for (const d of [v.forward, v.back]) {
      if (!d) continue;
      const pts = d.stops
        .map((s) => stationById(s.station))
        .filter(Boolean)
        .map((st) => [st!.lat, st!.lng] as [number, number]);
      if (pts.length > 1) out.push(pts);
    }
  }
  return out;
}

export function MapScreen() {
  const { mapFilter, setMapFilter, mapSelected, setMapSelected, schedType, effNow, openStation, goBack } =
    useApp();

  const [labels, setLabels] = useState(false);
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markers = useRef<Record<string, L.Marker>>({});
  const routes = useRef<Record<string, L.Polyline[]>>({});
  const onSelect = useRef<(id: string | null) => void>(() => {});
  onSelect.current = setMapSelected;

  // init jednom
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

    for (const line of LINES) {
      routes.current[line.id] = lineGeometries(line).map((pts) =>
        L.polyline(pts, {
          color: line.color,
          weight: 5,
          opacity: 0.55,
          lineJoin: 'round',
          lineCap: 'round',
        }).addTo(map),
      );
    }

    for (const st of STATIONS) {
      const m = L.marker([st.lat, st.lng], {
        icon: L.divIcon({
          className: '',
          html: `<div class="stop-marker"></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
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
    const all = mapFilter === '';
    for (const line of LINES) {
      const show = all || mapFilter === line.id;
      for (const pl of routes.current[line.id] ?? [])
        pl.setStyle({ opacity: show ? (all ? 0.5 : 0.9) : 0.06, weight: show && !all ? 6 : 5 });
    }
    const activeLine = all ? null : LINES.find((l) => l.id === mapFilter);
    for (const st of STATIONS) {
      const onLine =
        all ||
        (activeLine?.variants.some(
          (v) =>
            v.forward.stops.some((s) => s.station === st.id) ||
            (v.back?.stops.some((s) => s.station === st.id) ?? false),
        ) ??
          false);
      const m = markers.current[st.id];
      const el = m?.getElement();
      if (el) el.style.opacity = onLine ? '1' : '.2';
      // nazivi stanica (toggle) — prikaži samo za vidljive stanice da ne bude gužve
      if (m) {
        const wantLabel = labels && onLine;
        if (wantLabel && !m.getTooltip()) {
          m.bindTooltip(st.name, { permanent: true, direction: 'right', offset: [8, 0], className: 'stop-label' });
        } else if (!wantLabel && m.getTooltip()) {
          m.unbindTooltip();
        }
      }
    }
    if (activeLine) {
      const grp = L.featureGroup(routes.current[activeLine.id] ?? []);
      const bounds = grp.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [56, 56] });
    }
  }, [mapFilter, labels]);

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
  const deps = selected ? departuresAt(selected.id, schedType, now, 3) : [];

  return (
    <div className="view-map">
      <div className="map-el" ref={elRef} />

      <div className="map-top">
        <div className="map-top-row">
          <button className="map-back" onClick={goBack}>
            <Back /> Natrag
          </button>
          <button
            className={'chip labels-toggle' + (labels ? ' on' : '')}
            aria-pressed={labels}
            onClick={() => setLabels((v) => !v)}
          >
            {labels ? 'Sakrij nazive' : 'Nazivi stanica'}
          </button>
        </div>
        <div className="map-filters">
          <button className="chip" aria-pressed={mapFilter === ''} onClick={() => setMapFilter('')}>
            Sve linije
          </button>
          {LINES.map((l) => (
            <button
              key={l.id}
              className="chip line-filter"
              aria-pressed={mapFilter === l.id}
              aria-label={`Linija ${l.label} — ${lineEnds(l)}`}
              onClick={() => setMapFilter(l.id)}
            >
              <span className="dot" style={{ background: l.color }} />
              <b>{l.label}</b>
              <small>{lineEnds(l)}</small>
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div className="map-card">
          <div className="head">
            <h3>
              {selected.name}
              {selected.zona ? <small> · {selected.zona}</small> : null}
            </h3>
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
