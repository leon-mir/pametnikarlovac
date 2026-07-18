// Početni ekran (tab Stanica) — "Kad mi ide bus?".
import { useState } from 'react';
import { useApp } from '@/state/AppState';
import { STATIONS, stationById } from '@/lib/data';
import { departuresAt, firstTomorrow, noticesFor, tripConnections } from '@/lib/schedule';
import { fmt, fmtDate, nowMin, SCHED_LABEL } from '@/lib/dates';
import { Banner, DepartureRow } from '@/components/common';
import { DemoNote } from '@/components/DemoNote';
import { Chevron, Close, Locate, MapIcon, Pin, Search, Star, Swap } from '@/lib/icons';
import type { Connection } from '@/lib/types';

export function HomeScreen() {
  const {
    myStation,
    schedType,
    schedOverride,
    isTodayView,
    viewDateObj,
    effNow,
    openStation,
    go,
    tripFrom,
    setTripFrom,
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
          {noticesFor(my.id).map((l) => (
            <Banner key={l.id} line={l} />
          ))}
          <div className="hero">
            <p className="eyebrow">
              <Star filled /> Moja stanica
            </p>
            <h2>{my.name}</h2>
            {(() => {
              const deps = departuresAt(my.id, schedType, now, 4);
              if (deps.length) {
                return (
                  <ul className="dep-list">
                    {deps.map((d, i) => (
                      <li key={i}>
                        <DepartureRow dep={d} first={i === 0} />
                      </li>
                    ))}
                  </ul>
                );
              }
              const ft = firstTomorrow(my.id);
              return (
                <div className="empty">
                  <strong>Nema više polazaka danas.</strong>
                  {ft !== null ? 'Prvi sutra: ' + fmt(ft) + '.' : ''}
                </div>
              );
            })()}
            <div className="hero-actions">
              <button className="hero-link" onClick={() => openStation(my.id)}>
                Svi polasci <Chevron />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="hero">
          <p className="eyebrow">
            <Star /> Moja stanica
          </p>
          <h2>Spremi svoju stanicu</h2>
          <p className="lead">
            Odaberi stanicu ispod i polasci će te čekati ovdje — bez ijednog dodira.
          </p>
          <div style={{ height: 16 }} />
        </div>
      )}

      <SavedTrip />

      <button
        className="btn btn-secondary"
        onClick={() => {
          if (!tripFrom && myStation) setTripFrom(myStation);
          go('trip');
        }}
      >
        <Swap /> Putovanje tamo-natrag
      </button>

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

      <div>
        <p className="field-label">Sve stanice</p>
        <div className="chip-row">
          {STATIONS.map((s) => (
            <button key={s.id} className="chip" onClick={() => openStation(s.id)}>
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <DemoNote />
    </div>
  );
}

function SavedTrip() {
  const { trip, schedType, isTodayView, effNow, setTripFrom, setTripTo, go } = useApp();
  if (!trip) return null;
  const A = stationById(trip.a);
  const B = stationById(trip.b);
  if (!A || !B) return null;
  const now = effNow();
  const tamo = tripConnections(A.id, B.id, schedType, now, 1)[0];
  const natrag = tripConnections(B.id, A.id, schedType, now, 1)[0];
  const legVal = (d: Connection | undefined): [string, string] => {
    if (!d) return ['—', 'nema više danas'];
    const diff = d.time - nowMin();
    if (!isTodayView) return [fmt(d.time), 'linija ' + d.line.id];
    if (diff <= 0) return ['kreće', 'upravo · linija ' + d.line.id];
    if (diff > 59) return [fmt(d.time), 'linija ' + d.line.id];
    return ['za ' + diff + ' min', fmt(d.time) + ' · linija ' + d.line.id];
  };
  const [tv, ts] = legVal(tamo);
  const [nv, ns] = legVal(natrag);
  return (
    <button
      className="card trip-home"
      aria-label={`Moje putovanje ${A.name} – ${B.name}`}
      onClick={() => {
        setTripFrom(trip.a);
        setTripTo(trip.b);
        go('trip');
      }}
    >
      <span className="head">
        <Swap />{' '}
        <strong>
          {A.name} ⇄ {B.name}
        </strong>{' '}
        <span className="chev">
          <Chevron />
        </span>
      </span>
      <span className="legs">
        <span className="leg">
          <span className="lbl">Tamo</span>
          <span className="val">{tv}</span>
          <span className="sub">{ts}</span>
        </span>
        <span className="leg">
          <span className="lbl">Natrag</span>
          <span className="val">{nv}</span>
          <span className="sub">{ns}</span>
        </span>
      </span>
    </button>
  );
}

function StationSearch() {
  const { schedType, effNow, openStation } = useApp();
  const [q, setQ] = useState('');
  const now = effNow();
  const query = q.trim().toLowerCase();
  const hits = query
    ? STATIONS.filter((s) => s.name.toLowerCase().includes(query)).slice(0, 5)
    : [];
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
