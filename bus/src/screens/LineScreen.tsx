// Detalj linije — smjer, dolasci po stanicama za sljedeći polazak, mreža svih polazaka.
import { useEffect, type CSSProperties } from 'react';
import { useApp } from '@/state/AppState';
import { lineById, stationById } from '@/lib/data';
import { lineDepartTimes } from '@/lib/schedule';
import { fmt, fmtDate, SCHED_LABEL, toMin } from '@/lib/dates';
import { Banner, LineBadge } from '@/components/common';
import { BackButton } from '@/components/BackButton';
import { DemoNote } from '@/components/DemoNote';
import { MapIcon } from '@/lib/icons';

export function LineScreen() {
  const {
    line: lineId,
    lineDir,
    setLineDir,
    schedType,
    isTodayView,
    viewDateObj,
    effNow,
    openStation,
    setMapFilter,
    setMapSelected,
    go,
  } = useApp();
  const line = lineId != null ? lineById(lineId) : undefined;
  useEffect(() => {
    if (!line) go('lines', false);
  }, [line, go]);
  if (!line) return null;
  const dir = lineDir;
  const stops = dir === 0 ? line.stops : [...line.stops].reverse();
  const a = stationById(line.stops[0].station)?.name ?? '';
  const b = stationById(line.stops[line.stops.length - 1].station)?.name ?? '';
  const sc = line.sched[schedType];
  const total = line.stops[line.stops.length - 1].offset;
  const now = effNow();

  let nextDep: number | null = null;
  if (sc) {
    for (let t = toMin(sc.first); t <= toMin(sc.last); t += sc.headway) {
      if (t >= now) {
        nextDep = t;
        break;
      }
    }
    if (nextDep === null) nextDep = toMin(sc.first); // sutra — prikaži prvi
  }
  const offAt = (i: number) => (dir === 0 ? stops[i].offset : total - stops[i].offset);
  const departTimes = lineDepartTimes(line, schedType);
  const nextIdx = departTimes.findIndex((t) => t >= now);

  return (
    <div className="wrap">
      <BackButton />
      {line.notice && <Banner line={line} />}

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <LineBadge id={line.id} size={56} />
        <div>
          <h1 className="screen-title" style={{ fontSize: 'var(--pk-fs-h1)' }}>
            {a} ↔ {b}
          </h1>
          <p className="subtitle">
            {sc
              ? `${SCHED_LABEL[schedType]} · svakih ${sc.headway} min`
              : `${SCHED_LABEL[schedType]} — ne vozi`}
          </p>
        </div>
      </div>

      <div className="seg" role="group" aria-label="Smjer">
        <button aria-pressed={dir === 0} onClick={() => setLineDir(0)}>
          → {b}
        </button>
        <button aria-pressed={dir === 1} onClick={() => setLineDir(1)}>
          → {a}
        </button>
      </div>

      {sc && nextDep !== null ? (
        <>
          <div className="card pad">
            <p className="eyebrow">
              {nextDep >= now && departTimes[nextIdx] !== undefined
                ? 'Sljedeći polazak — dolasci po stanicama'
                : 'Prvi polazak — dolasci po stanicama'}
            </p>
            <ul
              className="route"
              style={{ '--route-color': `var(--pk-line-${line.id})` } as CSSProperties}
            >
              {stops.map((s, i) => (
                <li key={s.station} className={i === 0 || i === stops.length - 1 ? 'terminal' : ''}>
                  <span className="dot" />
                  <button className="stop-btn" onClick={() => openStation(s.station)}>
                    <span className="name">{stationById(s.station)?.name}</span>
                    <span className="t">{fmt(nextDep + offAt(i))}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="card pad">
            <p className="eyebrow">
              Svi polasci {isTodayView ? 'danas' : fmtDate(viewDateObj)} · {dir === 0 ? a : b}
            </p>
            <div className="times-grid">
              {departTimes.map((t, i) => (
                <span key={i} className={i === nextIdx ? 'next' : t < now ? 'past' : ''}>
                  {fmt(t)}
                </span>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="card pad empty">
          <strong>Danas linija {line.id} ne vozi.</strong>
          {line.sched.radni ? `Prvi polazak radnim danom u ${line.sched.radni.first}.` : ''}
        </div>
      )}

      <button
        className="btn btn-primary"
        onClick={() => {
          setMapFilter(line.id);
          setMapSelected(null);
          go('map');
        }}
      >
        <MapIcon /> Prikaži rutu na karti
      </button>

      <DemoNote extra="trasa približna" />
    </div>
  );
}
