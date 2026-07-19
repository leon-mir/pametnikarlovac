// Planer rute — od kuda do kuda; prikazuje izravne linije ili vezu s koliko god presjedanja treba.
import { useMemo } from 'react';
import { useApp } from '@/state/AppState';
import { STATIONS, stationById } from '@/lib/data';
import { planRoutes } from '@/lib/schedule';
import { fmt } from '@/lib/dates';
import { Eta, LineBadge } from '@/components/common';
import { Pin, Swap } from '@/lib/icons';
import type { Itinerary } from '@/lib/types';

function transfersLabel(n: number): string {
  if (n === 0) return 'izravno';
  if (n === 1) return '1 presjedanje';
  if (n < 5) return `${n} presjedanja`;
  return `${n} presjedanja`;
}

export function RoutePlanner({ compact }: { compact?: boolean }) {
  const { tripFrom: a, tripTo: b, setTripFrom, setTripTo, schedType, effNow } = useApp();
  const now = effNow();
  const options = useMemo(
    () => (a && b && a !== b ? planRoutes(a, b, schedType, now, 3) : []),
    [a, b, schedType, now],
  );
  const sorted = useMemo(
    () => [...STATIONS].sort((x, y) => x.name.localeCompare(y.name, 'hr')),
    [],
  );

  return (
    <div className={'route-planner' + (compact ? ' compact' : '')}>
      <StationSelect id="rp-from" label="Od" value={a} options={sorted} onChange={setTripFrom} />
      <button
        className="swap-btn"
        aria-label="Zamijeni polazište i odredište"
        onClick={() => {
          setTripFrom(b);
          setTripTo(a);
        }}
      >
        <Swap /> Zamijeni
      </button>
      <StationSelect id="rp-to" label="Do" value={b} options={sorted} onChange={setTripTo} />

      {a && b && a === b ? (
        <p className="subtitle rp-hint">Odaberi dvije različite stanice.</p>
      ) : a && b ? (
        options.length ? (
          <ul className="itin-list">
            {options.map((it, i) => (
              <li key={i}>
                <ItinCard it={it} first={i === 0} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="subtitle rp-hint">Nema veze u odabranom danu (ni s presjedanjem).</p>
        )
      ) : (
        <p className="subtitle rp-hint">Odaberi polazište i odredište.</p>
      )}
    </div>
  );
}

function ItinCard({ it, first }: { it: Itinerary; first?: boolean }) {
  return (
    <div className={'itin' + (first ? ' first' : '')}>
      <div className="itin-head">
        <span className="itin-time">
          {fmt(it.depart)} → {fmt(it.arrive)}
        </span>
        <span className="itin-meta">
          {transfersLabel(it.transfers)} · {it.arrive - it.depart} min
        </span>
        <Eta time={it.depart} />
      </div>
      <ol className="itin-legs">
        {it.legs.map((l, i) => (
          <li key={i} className="itin-leg">
            <LineBadge line={l.line} size={30} />
            <span className="txt">
              <b>{fmt(l.depart)}</b> {stationById(l.fromId)?.name}
              <span className="arrow"> → </span>
              <b>{fmt(l.arrive)}</b> {stationById(l.toId)?.name}
              {i < it.legs.length - 1 && (
                <span className="xfer"> · presjedanje u {stationById(l.toId)?.name}</span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function StationSelect({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string | null;
  options: typeof STATIONS;
  onChange: (v: string | null) => void;
}) {
  return (
    <div className="rp-field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <div className="select-box">
        <Pin />
        <select id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
          <option value="">Odaberi stanicu…</option>
          {options.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
