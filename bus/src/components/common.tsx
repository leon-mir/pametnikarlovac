// Zajedničke male komponente prikaza (badge linije, banner, redak polaska, ETA).
import { useApp } from '@/state/AppState';
import { fmt, nowMin } from '@/lib/dates';
import { Warn } from '@/lib/icons';
import type { Departure, Line } from '@/lib/types';

export function LineBadge({ id, size }: { id: number; size?: number }) {
  const style = size
    ? { background: `var(--pk-line-${id})`, width: size, height: size, flexBasis: size }
    : { background: `var(--pk-line-${id})` };
  return (
    <span className="line-badge" style={style} aria-label={`Linija ${id}`}>
      {id}
    </span>
  );
}

export function Banner({ line }: { line: Line }) {
  return (
    <div className="banner banner-warn" role="alert">
      <Warn />
      <div>
        <strong>Obavijest.</strong> {line.notice}
      </div>
    </div>
  );
}

/** Prikaz "za X min" / "kreće upravo" / apsolutno vrijeme, ovisno o danu. */
export function Eta({ time, onDark }: { time: number; onDark?: boolean }) {
  const { isTodayView } = useApp();
  void onDark;
  if (!isTodayView) {
    return (
      <div className="dep-eta">
        <span className="big">{fmt(time)}</span>
        <span className="unit">polazak</span>
      </div>
    );
  }
  const diff = time - nowMin();
  if (diff <= 0) {
    return (
      <div className="dep-eta now">
        <span className="big">kreće</span>
        <span className="unit">upravo</span>
      </div>
    );
  }
  if (diff > 59) {
    return (
      <div className="dep-eta">
        <span className="big">{fmt(time)}</span>
        <span className="unit">polazak</span>
      </div>
    );
  }
  return (
    <div className="dep-eta">
      <span className="big">za {diff} min</span>
      <span className="unit">{fmt(time)}</span>
    </div>
  );
}

/** Redak polaska. Ako je `to` string, prikaži smjer; klik otvara stanicu ako je zadan gotoStation. */
export function DepartureRow({
  dep,
  first,
  gotoStation,
}: {
  dep: Departure;
  first?: boolean;
  gotoStation?: string;
}) {
  const { openStation } = useApp();
  const inner = (
    <>
      <LineBadge id={dep.line.id} />
      <div className="dep-main">
        <div className="dep-dir">→ {dep.to}</div>
        <div className="dep-time">
          linija {dep.line.id} · {fmt(dep.time)}
        </div>
      </div>
      <Eta time={dep.time} />
    </>
  );
  const cls = 'dep-row' + (first ? ' first' : '');
  if (gotoStation) {
    return (
      <button className={cls} onClick={() => openStation(gotoStation)}>
        {inner}
      </button>
    );
  }
  return <div className={cls}>{inner}</div>;
}

export function Toast() {
  const { toastMsg } = useApp();
  return (
    <div className={'toast' + (toastMsg ? ' show' : '')} role="status" aria-live="polite">
      {toastMsg}
    </div>
  );
}
