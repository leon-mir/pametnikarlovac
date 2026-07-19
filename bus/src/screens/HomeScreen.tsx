// Početni ekran (tab Stanica) — "Kad mi ide bus?".
import { useMemo, useState } from 'react';
import { useApp } from '@/state/AppState';
import { STATIONS, stationById } from '@/lib/data';
import { departuresAt, firstTomorrow, noticesFor } from '@/lib/schedule';
import { fmt, fmtDate, SCHED_LABEL } from '@/lib/dates';
import { NoticeBanners, LineBadge, Eta } from '@/components/common';
import { RoutePlanner } from '@/components/RoutePlanner';
import { DemoNote } from '@/components/DemoNote';
import { Chevron, Close, Locate, MapIcon, Pin, Search, Star } from '@/lib/icons';
import type { Departure } from '@/lib/types';

export function HomeScreen() {
  const {
    myStation,
    schedType,
    schedOverride,
    isTodayView,
    viewDateObj,
    effNow,
    openStation,
    openLine,
    go,
    toast,
  } = useApp();
  const now = effNow();
  const my = stationById(myStation);

  return (
    <div className="wrap">
      <div>
        <h1 className="screen-title">Kad mi ide bus?</h1>
        <p className="subtitle">
          {isTodayView ? 'Danas vozi' : 'Vozni red za ' + fmtDate(viewDateObj)}:{' '}
          <strong>{SCHED_LABEL[schedType].toLowerCase()}</strong>
          {schedOverride !== 'auto' ? ' (ručno odabrano)' : ''}
        </p>
      </div>

      {my ? (
        <>
          <NoticeBanners lines={noticesFor(my.id)} />
          <div className="hero">
            <div className="hero-top">
              <p className="eyebrow">
                <Star filled /> Moja stanica
              </p>
              <button className="hero-change" onClick={() => openStation(my.id)}>
                promijeni
              </button>
            </div>
            <h2>{my.name}</h2>
            {(() => {
              const deps = departuresAt(my.id, schedType, now, 6);
              if (!deps.length) {
                const ft = firstTomorrow(my.id);
                return (
                  <div className="hero-empty">
                    <strong>Nema više polazaka danas.</strong>
                    {ft !== null ? ' Prvi sutra: ' + fmt(ft) + '.' : ''}
                  </div>
                );
              }
              return <HeroDepartures deps={deps} onLine={openLine} />;
            })()}
            <button className="hero-all" onClick={() => openStation(my.id)}>
              Svi polasci <Chevron />
            </button>
          </div>
        </>
      ) : (
        <div className="hero">
          <p className="eyebrow">
            <Star /> Moja stanica
          </p>
          <h2>Spremi svoju stanicu</h2>
          <p className="lead">Odaberi stanicu ispod i polasci će te čekati ovdje — bez ijednog dodira.</p>
        </div>
      )}

      <div className="card pad">
        <p className="eyebrow" style={{ marginBottom: 10 }}>
          Kako doći — planer rute
        </p>
        <RoutePlanner />
      </div>

      <StationSearch />

      <div className="btn-row">
        <button
          className="btn btn-primary"
          onClick={() => {
            if (!navigator.geolocation) {
              toast('Uređaj ne podržava lokaciju.');
              return;
            }
            toast('Tražim najbližu stanicu…');
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const { latitude: la, longitude: lo } = pos.coords;
                let best = STATIONS[0];
                let bd = Infinity;
                for (const s of STATIONS) {
                  const d = Math.hypot((s.lat - la) * 111320, (s.lng - lo) * 78000);
                  if (d < bd) {
                    bd = d;
                    best = s;
                  }
                }
                openStation(best.id);
                toast(`Najbliža stanica: ${best.name}`);
              },
              () => toast('Lokacija nije dostupna — odaberi stanicu ručno.'),
              { timeout: 8000 },
            );
          }}
        >
          <Locate /> Najbliža stanica
        </button>
        <button className="btn btn-secondary" onClick={() => go('map')}>
          <MapIcon /> Karta
        </button>
      </div>

      <AllStations />

      <DemoNote />
    </div>
  );
}

/** Hero prikaz: jedan istaknut sljedeći polazak + "zatim" niz idućih vremena. */
function HeroDepartures({ deps, onLine }: { deps: Departure[]; onLine: (id: string, v?: number, d?: 0 | 1) => void }) {
  const first = deps[0];
  const seen = new Set([first.time]);
  const rest: Departure[] = [];
  for (const d of deps.slice(1)) {
    if (seen.has(d.time)) continue;
    seen.add(d.time);
    rest.push(d);
    if (rest.length >= 4) break;
  }
  const vIdx = Math.max(0, first.line.variants.indexOf(first.variant));
  return (
    <div className="hero-dep">
      <button
        className="hero-next"
        onClick={() => onLine(first.line.id, vIdx, first.dir)}
        aria-label={`Linija ${first.line.label} prema ${first.to}`}
      >
        <LineBadge line={first.line} />
        <span className="hero-next-main">
          <span className="dir">→ {first.to}</span>
          <span className="sub">
            linija {first.line.label} · polazak {fmt(first.time)}
          </span>
        </span>
        <Eta time={first.time} />
      </button>
      {rest.length > 0 && (
        <div className="hero-then">
          <span className="lbl">zatim</span>
          {rest.map((d, i) => (
            <span key={i} className="t">
              {fmt(d.time)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function AllStations() {
  const { schedType, effNow, openStation } = useApp();
  const [open, setOpen] = useState(false);
  const now = effNow();
  const sorted = useMemo(() => [...STATIONS].sort((a, b) => a.name.localeCompare(b.name, 'hr')), []);
  return (
    <div>
      <button className="disclosure" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span>Sve stanice ({STATIONS.length})</span>
        <Chevron size={20} className={'caret' + (open ? ' up' : '')} />
      </button>
      {open && (
        <ul className="station-list">
          {sorted.map((s) => {
            const n = departuresAt(s.id, schedType, now, 1)[0];
            return (
              <li key={s.id}>
                <button className="station-row" onClick={() => openStation(s.id)}>
                  <Pin />
                  <span className="nm">{s.name}</span>
                  <span className="nx">{n ? fmt(n.time) : '—'}</span>
                  <Chevron size={18} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function StationSearch() {
  const { schedType, effNow, openStation } = useApp();
  const [q, setQ] = useState('');
  const now = effNow();
  const query = q.trim().toLowerCase();
  const hits = query ? STATIONS.filter((s) => s.name.toLowerCase().includes(query)).slice(0, 6) : [];
  return (
    <div>
      <label className="field-label" htmlFor="search-input">
        Odaberi stanicu
      </label>
      <div className="search-wrap">
        <div className="search-box">
          <Search />
          <input
            id="search-input"
            type="search"
            placeholder="Upiši ime stanice…"
            autoComplete="off"
            aria-label="Pretraži stanice"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q.length > 0 && (
            <button className="search-clear" aria-label="Očisti pretragu" onClick={() => setQ('')}>
              <Close />
            </button>
          )}
        </div>
        {query && (
          <div className="suggest" role="listbox">
            {hits.length ? (
              hits.map((s) => {
                const n = departuresAt(s.id, schedType, now, 1)[0];
                return (
                  <button key={s.id} role="option" onClick={() => openStation(s.id)}>
                    <Pin /> {s.name}
                    <span className="muted">{n ? 'sljedeći ' + fmt(n.time) : 'nema danas'}</span>
                  </button>
                );
              })
            ) : (
              <button disabled style={{ color: 'var(--pk-text-muted)' }}>
                Nema stanice s tim imenom.
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
