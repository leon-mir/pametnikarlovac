// Zajedničke male komponente prikaza (značka linije, banner, redak polaska, ETA).
import { useApp } from '@/state/AppState';
import { fmt, nowMin } from '@/lib/dates';
import { Warn } from '@/lib/icons';
import type { Departure, Line } from '@/lib/types';

/** Vizualna značka linije (obojena, bijeli broj). Nije klikabilna sama po sebi. */
export function LineBadge({ line, size }: { line: Line; size?: number }) {
  const style = size
    ? {
        background: line.color,
        width: size,
        height: size,
        flexBasis: size,
        fontSize: Math.round(size * 0.42),
      }
    : { background: line.color };
  return (
    <span className="line-badge" style={style} aria-hidden>
      {line.label}
    </span>
  );
}

/** Klikabilna značka linije → otvara stranicu te linije. */
export function LineChip({ line, size }: { line: Line; size?: number }) {
  const { openLine } = useApp();
  return (
    <button className="line-chip" onClick={() => openLine(line.id)} aria-label={`Linija ${line.label}`}>
      <LineBadge line={line} size={size} />
    </button>
  );
}

/** Jedan banner za skupinu linija koje dijele istu obavijest. */
function GroupBanner({ lines }: { lines: Line[] }) {
  const n = lines[0].notice;
  return (
    <div className="banner banner-warn" role="alert">
      <Warn />
      <div>
        <strong>
          Obavijest — {lines.length > 1 ? 'linije' : 'linija'} {lines.map((l) => l.label).join(', ')}.
        </strong>{' '}
        {n?.text}{' '}
        {n?.url && (
          <a href={n.url} target="_blank" rel="noopener">
            Više (PDF)
          </a>
        )}
        <div className="banner-lines">
          {lines.map((l) => (
            <LineChip key={l.id} line={l} size={28} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Obavijesti za skup linija — identičan tekst se spaja u jedan banner (ne ponavlja se). */
export function NoticeBanners({ lines }: { lines: Line[] }) {
  const groups = new Map<string, Line[]>();
  for (const l of lines) {
    if (!l.notice) continue;
    const arr = groups.get(l.notice.text) ?? [];
    arr.push(l);
    groups.set(l.notice.text, arr);
  }
  return (
    <>
      {[...groups.values()].map((grp, i) => (
        <GroupBanner key={i} lines={grp} />
      ))}
    </>
  );
}

/** Obavijest za jednu liniju (na stranici linije). */
export function Banner({ line }: { line: Line }) {
  return <GroupBanner lines={[line]} />;
}

/** Prikaz "za X min" / "kreće upravo" / apsolutno vrijeme, ovisno o danu. */
export function Eta({ time }: { time: number }) {
  const { isTodayView } = useApp();
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

/** Redak polaska. Klik otvara stranicu linije (i točnu varijantu/smjer) → vide se sve stanice. */
export function DepartureRow({ dep, first }: { dep: Departure; first?: boolean }) {
  const { openLine } = useApp();
  const variantIdx = Math.max(0, dep.line.variants.indexOf(dep.variant));
  return (
    <button
      className={'dep-row' + (first ? ' first' : '')}
      onClick={() => openLine(dep.line.id, variantIdx, dep.dir)}
      aria-label={`Linija ${dep.line.label} prema ${dep.to}, polazak ${fmt(dep.time)}`}
    >
      <LineBadge line={dep.line} />
      <div className="dep-main">
        <div className="dep-dir">→ {dep.to}</div>
        <div className="dep-time">
          linija {dep.line.label} · {fmt(dep.time)}
        </div>
      </div>
      <Eta time={dep.time} />
    </button>
  );
}

export function Toast() {
  const { toastMsg } = useApp();
  return (
    <div className={'toast' + (toastMsg ? ' show' : '')} role="status" aria-live="polite">
      {toastMsg}
    </div>
  );
}
