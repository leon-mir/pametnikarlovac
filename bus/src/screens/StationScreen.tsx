// Ekran stanice — sljedeći polasci ili cijeli dnevni raspored, spremi stanicu, na kartu, putovanje.
import { useEffect } from 'react';
import { useApp } from '@/state/AppState';
import { LINES, stationById } from '@/lib/data';
import {
  departuresAt,
  firstTomorrow,
  lineTerminal,
  lineTimesAt,
  noticesFor,
} from '@/lib/schedule';
import { fmt, SCHED_LABEL } from '@/lib/dates';
import { Banner, DepartureRow, LineBadge } from '@/components/common';
import { BackButton } from '@/components/BackButton';
import { DemoNote } from '@/components/DemoNote';
import { MapIcon, Star, Swap } from '@/lib/icons';

export function StationScreen() {
  const {
    station,
    schedType,
    isTodayView,
    effNow,
    myStation,
    setMyStation,
    stationShowAll,
    setStationShowAll,
    setMapSelected,
    setTripFrom,
    setTripTo,
    go,
    toast,
  } = useApp();
  const st = stationById(station);
  useEffect(() => {
    if (!st) go('home', false);
  }, [st, go]);
  if (!st) return null;
  const now = effNow();
  const notices = noticesFor(st.id);
  const isMy = myStation === st.id;
  const linesHere = LINES.filter((l) => l.stops.some((s) => s.station === st.id));

  return (
    <div className="wrap">
      <BackButton />
      {notices.map((l) => (
        <Banner key={l.id} line={l} />
      ))}
      <div>
        <p className="eyebrow">Stanica</p>
        <h1 className="screen-title">{st.name}</h1>
        <p className="subtitle">
          Linije: {linesHere.map((l) => l.id).join(', ')} · {SCHED_LABEL[schedType].toLowerCase()}
        </p>
      </div>

      {!stationShowAll ? (
        (() => {
          const deps = departuresAt(st.id, schedType, now, 8);
          if (deps.length) {
            return (
              <div className="card pad">
                <h2 className="eyebrow" style={{ marginBottom: 4 }}>
                  Sljedeći polasci
                </h2>
                <ul className="dep-list flat">
                  {deps.map((d, i) => (
                    <li key={i}>
                      <DepartureRow dep={d} first={i === 0} />
                    </li>
                  ))}
                </ul>
              </div>
            );
          }
          if (!isTodayView) {
            return (
              <div className="card pad empty">
                <strong>Taj dan nema polazaka s ove stanice.</strong>
              </div>
            );
          }
          const ft = firstTomorrow(st.id);
          return (
            <div className="card pad empty">
              <strong>Nema više polazaka danas.</strong>
              {ft !== null ? 'Prvi sutra: ' + fmt(ft) + '.' : ''}
            </div>
          );
        })()
      ) : (
        <FullSchedule stationId={st.id} />
      )}

      <div className="btn-row">
        <button
          className={'btn ' + (isMy ? 'btn-secondary' : 'btn-primary')}
          onClick={() => {
            if (isMy) {
              setMyStation(null);
              toast('Stanica uklonjena');
            } else {
              setMyStation(st.id);
              toast('Stanica spremljena ✓');
            }
          }}
        >
          <Star filled={isMy} /> {isMy ? 'Moja stanica ✓' : 'Spremi stanicu'}
        </button>
        <button className="btn btn-secondary" onClick={() => setStationShowAll(!stationShowAll)}>
          {stationShowAll
            ? 'Sljedeći polasci'
            : isTodayView
              ? 'Svi polasci danas'
              : 'Svi polasci taj dan'}
        </button>
      </div>
      <div className="btn-row">
        <button
          className="btn btn-secondary"
          onClick={() => {
            setMapSelected(st.id);
            go('map');
          }}
        >
          <MapIcon /> Na karti
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => {
            setTripFrom(st.id);
            setTripTo(null);
            go('trip');
          }}
        >
          <Swap /> Putovanje
        </button>
      </div>

      <DemoNote />
    </div>
  );
}

function FullSchedule({ stationId }: { stationId: string }) {
  const { schedType, effNow } = useApp();
  const now = effNow();
  const linesHere = LINES.filter((l) => l.stops.some((s) => s.station === stationId));
  const groups: { line: (typeof LINES)[number]; dir: 0 | 1; times: number[] }[] = [];
  for (const line of linesHere) {
    for (const dir of [0, 1] as const) {
      const stops = dir === 0 ? line.stops : [...line.stops].reverse();
      const idx = stops.findIndex((s) => s.station === stationId);
      if (idx === -1 || idx === stops.length - 1) continue;
      const times = lineTimesAt(line, stationId, dir, schedType);
      if (times.length) groups.push({ line, dir, times });
    }
  }
  if (!groups.length) {
    return (
      <div className="card pad empty">
        <strong>Danas nema polazaka.</strong>
      </div>
    );
  }
  return (
    <>
      {groups.map((g, gi) => {
        const nextIdx = g.times.findIndex((t) => t >= now);
        return (
          <div className="card pad" key={gi}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <LineBadge id={g.line.id} />
              <strong style={{ fontSize: 'var(--pk-fs-body-lg)' }}>
                → {lineTerminal(g.line, g.dir)}
              </strong>
            </div>
            <div className="times-grid">
              {g.times.map((t, i) => (
                <span key={i} className={i === nextIdx ? 'next' : t < now ? 'past' : ''}>
                  {fmt(t)}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}
