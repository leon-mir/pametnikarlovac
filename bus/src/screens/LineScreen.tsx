// Detalj linije — trasa i smjer, ugrađena karta, odabir polaska pa dolasci po stanicama.
import { Suspense, lazy, useEffect, useState, type CSSProperties } from 'react';
import { useApp } from '@/state/AppState';
import { lineById, stationById } from '@/lib/data';
import { dirData } from '@/lib/schedule';
import { fmt, SCHED_LABEL, toMin } from '@/lib/dates';
import { Banner, LineBadge } from '@/components/common';
import { BackButton } from '@/components/BackButton';
import { DemoNote } from '@/components/DemoNote';

const RouteMap = lazy(() => import('@/components/RouteMap').then((m) => ({ default: m.RouteMap })));

export function LineScreen() {
  const {
    line: lineId,
    lineVariant,
    setLineVariant,
    lineDir,
    setLineDir,
    schedType,
    effNow,
    openStation,
    go,
  } = useApp();
  const line = lineById(lineId);
  const [pickedStart, setPickedStart] = useState<number | null>(null);

  useEffect(() => {
    if (!line) go('lines', false);
  }, [line, go]);
  // reset odabranog polaska kad se promijeni varijanta/smjer/dan
  useEffect(() => setPickedStart(null), [lineId, lineVariant, lineDir, schedType]);
  if (!line) return null;

  const variant = line.variants[lineVariant] ?? line.variants[0];
  const hasBack = !!variant.back;
  const dir: 0 | 1 = lineDir === 1 && !hasBack ? 0 : lineDir;
  const d = dirData(variant, dir) ?? variant.forward;

  const startName = stationById(d.stops[0]?.station)?.name ?? '';
  const endName = stationById(d.stops[d.stops.length - 1]?.station)?.name ?? '';
  const fStart = stationById(variant.forward.stops[0]?.station)?.name ?? '';
  const fEnd = stationById(variant.forward.stops[variant.forward.stops.length - 1]?.station)?.name ?? '';
  const bStart = variant.back ? (stationById(variant.back.stops[0]?.station)?.name ?? '') : fEnd;
  const bEnd = variant.back ? (stationById(variant.back.stops[variant.back.stops.length - 1]?.station)?.name ?? '') : fStart;

  const now = effNow();
  const starts = (d.departures[schedType] ?? []).map(toMin);
  const nextIdx = starts.findIndex((t) => t >= now);
  const selStart = pickedStart ?? (nextIdx >= 0 ? starts[nextIdx] : (starts[0] ?? null));

  return (
    <div className="wrap">
      <BackButton />
      {line.notice && <Banner line={line} />}

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <LineBadge line={line} size={56} />
        <div>
          <h1 className="screen-title" style={{ fontSize: 'var(--pk-fs-h1)' }}>
            Linija {line.label}
          </h1>
          <p className="subtitle">
            {starts.length ? `${SCHED_LABEL[schedType]} · ${starts.length} polazaka` : `${SCHED_LABEL[schedType]} — ne vozi`}
            {line.avgMinutes ? ` · ~${line.avgMinutes} min vožnje` : ''}
          </p>
        </div>
      </div>

      {line.variants.length > 1 && (
        <div>
          <p className="field-label">Trasa</p>
          <div className="select-box">
            <select aria-label="Odaberi trasu" value={lineVariant} onChange={(e) => setLineVariant(Number(e.target.value))}>
              {line.variants.map((v, i) => (
                <option key={i} value={i}>
                  {v.naziv}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Smjer — puni nazivi A → B / B → A da bude jasno */}
      <div className="seg dir-seg" role="group" aria-label="Smjer">
        <button aria-pressed={dir === 0} onClick={() => setLineDir(0)}>
          {fStart} → {fEnd}
        </button>
        <button aria-pressed={dir === 1} disabled={!hasBack} onClick={() => hasBack && setLineDir(1)}>
          {bStart} → {bEnd}
        </button>
      </div>

      {/* Karta trase — odmah vidljiva */}
      <Suspense fallback={<div className="route-map" aria-busy="true" />}>
        <RouteMap line={line} dir={d} onStop={openStation} />
      </Suspense>

      {selStart !== null ? (
        <>
          {/* Odabir polaska — gore; klik na vrijeme mijenja dolaske po stanicama ispod */}
          <div className="card pad">
            <p className="eyebrow">Odaberi polazak ({startName} → {endName})</p>
            <p className="subtitle" style={{ marginTop: 0, marginBottom: 8 }}>
              Dodirni vrijeme da vidiš kad bus stiže na svaku stanicu.
            </p>
            <div className="times-grid pickable">
              {starts.map((t, i) => (
                <button
                  key={i}
                  className={'time-pick' + (t === selStart ? ' sel' : '') + (i === nextIdx && pickedStart === null ? ' next' : '') + (t < now ? ' past' : '')}
                  onClick={() => setPickedStart(t)}
                >
                  {fmt(t)}
                </button>
              ))}
            </div>
          </div>

          {/* Dolasci po stanicama za odabrani polazak */}
          <div className="card pad">
            <p className="eyebrow">
              Polazak u <strong>{fmt(selStart)}</strong> — dolasci po stanicama
            </p>
            <ul className="route" style={{ ['--route-color' as string]: line.color } as CSSProperties}>
              {d.stops.map((s, i) => (
                <li key={s.station + '-' + i} className={i === 0 || i === d.stops.length - 1 ? 'terminal' : ''}>
                  <span className="dot" />
                  <button className="stop-btn" onClick={() => openStation(s.station)}>
                    <span className="name">{stationById(s.station)?.name}</span>
                    <span className="t">{fmt(selStart + s.offset)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <div className="card pad empty">
          <strong>
            {SCHED_LABEL[schedType]} linija {line.label} ne vozi u ovom smjeru.
          </strong>
          {variant.forward.departures.radni?.length
            ? ` Prvi polazak radnim danom u ${variant.forward.departures.radni[0]}.`
            : ''}
        </div>
      )}

      <DemoNote />
    </div>
  );
}
