// Detalj linije — varijanta (trasa) i smjer, dolasci po stanicama za odabrani polazak, svi polasci.
import { useEffect } from 'react';
import { useApp } from '@/state/AppState';
import { lineById, stationById } from '@/lib/data';
import { dirData } from '@/lib/schedule';
import { fmt, fmtDate, SCHED_LABEL, toMin } from '@/lib/dates';
import { Banner, LineBadge } from '@/components/common';
import { BackButton } from '@/components/BackButton';
import { DemoNote } from '@/components/DemoNote';
import { MapIcon } from '@/lib/icons';

export function LineScreen() {
  const {
    line: lineId,
    lineVariant,
    setLineVariant,
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
  const line = lineById(lineId);
  useEffect(() => {
    if (!line) go('lines', false);
  }, [line, go]);
  if (!line) return null;

  const variant = line.variants[lineVariant] ?? line.variants[0];
  const hasBack = !!variant.back;
  const dir: 0 | 1 = lineDir === 1 && !hasBack ? 0 : lineDir;
  const d = dirData(variant, dir) ?? variant.forward;

  const startName = stationById(d.stops[0]?.station)?.name ?? '';
  const endName = stationById(d.stops[d.stops.length - 1]?.station)?.name ?? '';
  const fwdEnd = stationById(variant.forward.stops[variant.forward.stops.length - 1]?.station)?.name ?? '';
  const bwdEnd = variant.back
    ? (stationById(variant.back.stops[variant.back.stops.length - 1]?.station)?.name ?? '')
    : startName;

  const now = effNow();
  const starts = (d.departures[schedType] ?? []).map(toMin);
  const nextIdx = starts.findIndex((t) => t >= now);
  const selStart = nextIdx >= 0 ? starts[nextIdx] : (starts[0] ?? null);

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
            {starts.length
              ? `${SCHED_LABEL[schedType]} · ${starts.length} polazaka`
              : `${SCHED_LABEL[schedType]} — ne vozi`}
            {line.avgMinutes ? ` · ~${line.avgMinutes} min vožnje` : ''}
          </p>
        </div>
      </div>

      {line.variants.length > 1 && (
        <div>
          <p className="field-label">Trasa</p>
          <div className="select-box">
            <select
              aria-label="Odaberi trasu"
              value={lineVariant}
              onChange={(e) => setLineVariant(Number(e.target.value))}
            >
              {line.variants.map((v, i) => (
                <option key={i} value={i}>
                  {v.naziv}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="seg" role="group" aria-label="Smjer">
        <button aria-pressed={dir === 0} onClick={() => setLineDir(0)}>
          → {fwdEnd}
        </button>
        <button aria-pressed={dir === 1} disabled={!hasBack} onClick={() => hasBack && setLineDir(1)}>
          → {bwdEnd}
        </button>
      </div>

      {selStart !== null ? (
        <>
          <div className="card pad">
            <p className="eyebrow">
              {nextIdx >= 0 ? 'Sljedeći polazak' : 'Prvi polazak'} u <strong>{fmt(selStart)}</strong> — dolasci po
              stanicama
            </p>
            <ul className="route" style={{ ['--route-color' as string]: line.color }}>
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

          <div className="card pad">
            <p className="eyebrow">
              Svi polasci {isTodayView ? 'danas' : fmtDate(viewDateObj)} s početne stanice ({startName})
            </p>
            <p className="subtitle" style={{ marginTop: 0, marginBottom: 8 }}>
              Vrijeme kad autobus kreće u smjeru → {endName}.
            </p>
            <div className="times-grid">
              {starts.map((t, i) => (
                <span key={i} className={i === nextIdx ? 'next' : t < now ? 'past' : ''}>
                  {fmt(t)}
                </span>
              ))}
            </div>
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

      <DemoNote />
    </div>
  );
}
