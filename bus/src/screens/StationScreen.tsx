// Ekran stanice — sljedeći polasci ili cijeli dnevni raspored, spremi stanicu, na kartu, putovanje.
import { useEffect } from 'react';
import { useApp } from '@/state/AppState';
import { LINES, stationById, linesAt } from '@/lib/data';
import { departuresAt, firstTomorrow, dirData, dirTerminal, timesAtStation, noticesFor } from '@/lib/schedule';
import { fmt } from '@/lib/dates';
import { NoticeBanners, DepartureRow, LineBadge, LineChip } from '@/components/common';
import { BackButton } from '@/components/BackButton';
import { DemoNote } from '@/components/DemoNote';
import { MapIcon, Star, Swap, Chevron } from '@/lib/icons';
import type { Line, Variant } from '@/lib/types';

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
  const linesHere = linesAt(st.id);

  return (
    <div className="wrap">
      <BackButton />
      <NoticeBanners lines={notices} />
      <div>
        <p className="eyebrow">Stanica{st.zona ? ' · ' + st.zona : ''}</p>
        <h1 className="screen-title">{st.name}</h1>
        <p className="subtitle">Linije na ovoj stanici — dodirni za trasu i vozni red:</p>
        <div className="chip-row line-chips">
          {linesHere.map((l) => (
            <LineChip key={l.id} line={l} />
          ))}
        </div>
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
              {ft !== null ? ' Prvi sutra: ' + fmt(ft) + '.' : ''}
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

interface Group {
  line: Line;
  variant: Variant;
  dir: 0 | 1;
  to: string;
  times: number[];
}

function FullSchedule({ stationId }: { stationId: string }) {
  const { schedType, effNow, openLine } = useApp();
  const now = effNow();
  const groups: Group[] = [];
  for (const line of LINES) {
    for (const variant of line.variants) {
      for (const dir of [0, 1] as const) {
        const d = dirData(variant, dir);
        if (!d) continue;
        const idx = d.stops.findIndex((s) => s.station === stationId);
        if (idx === -1 || idx === d.stops.length - 1) continue;
        const times = timesAtStation(d, stationId, schedType);
        if (times.length) groups.push({ line, variant, dir, to: dirTerminal(d), times });
      }
    }
  }
  if (!groups.length) {
    return (
      <div className="card pad empty">
        <strong>Taj dan nema polazaka s ove stanice.</strong>
      </div>
    );
  }
  return (
    <>
      {groups.map((g, gi) => {
        const nextIdx = g.times.findIndex((t) => t >= now);
        const variantIdx = g.line.variants.indexOf(g.variant);
        return (
          <div className="card pad" key={gi}>
            <button
              className="sched-head"
              onClick={() => openLine(g.line.id, variantIdx, g.dir)}
              aria-label={`Linija ${g.line.label} prema ${g.to} — otvori trasu`}
            >
              <LineBadge line={g.line} />
              <strong style={{ fontSize: 'var(--pk-fs-body-lg)' }}>→ {g.to}</strong>
              <span className="chev">
                <Chevron />
              </span>
            </button>
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
