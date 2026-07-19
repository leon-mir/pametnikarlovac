// Popis svih linija.
import { useApp } from '@/state/AppState';
import { LINES } from '@/lib/data';
import { LineBadge } from '@/components/common';
import { Chevron, Warn } from '@/lib/icons';
import type { Line, SchedType } from '@/lib/types';

/** Broj polazaka linije danas (svi smjerovi svih varijanti). */
function departuresToday(line: Line, sched: SchedType): number {
  let n = 0;
  for (const v of line.variants) {
    n += v.forward.departures[sched]?.length ?? 0;
    n += v.back?.departures[sched]?.length ?? 0;
  }
  return n;
}

export function LinesScreen() {
  const { schedType, openLine } = useApp();

  return (
    <div className="wrap">
      <h1 className="screen-title">Linije</h1>
      <ul className="line-list">
        {LINES.map((l) => {
          const n = departuresToday(l, schedType);
          const naziv = l.variants[0]?.naziv ?? '';
          return (
            <li key={l.id}>
              <button className="card line-card" onClick={() => openLine(l.id)}>
                <LineBadge line={l} />
                <span className="dirs">
                  <strong>{naziv}</strong>
                  <span>
                    {n ? `${n} polazaka danas` : 'danas ne vozi'}
                    {l.variants.length > 1 ? ` · ${l.variants.length} trase` : ''}
                    {l.notice ? (
                      <>
                        {' · '}
                        <Warn size={15} /> obavijest
                      </>
                    ) : (
                      ''
                    )}
                  </span>
                </span>
                <span className="chev">
                  <Chevron />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
