// Popis svih linija.
import { useApp } from '@/state/AppState';
import { LINES, stationById } from '@/lib/data';
import { LineBadge } from '@/components/common';
import { Chevron } from '@/lib/icons';

export function LinesScreen() {
  const { schedType, setLine, setLineDir, go } = useApp();

  const open = (id: number) => {
    setLine(id);
    setLineDir(0);
    go('line');
  };

  return (
    <div className="wrap">
      <h1 className="screen-title">Linije</h1>
      <ul className="line-list">
        {LINES.map((l) => {
          const sc = l.sched[schedType];
          const a = stationById(l.stops[0].station)?.name ?? '';
          const b = stationById(l.stops[l.stops.length - 1].station)?.name ?? '';
          return (
            <li key={l.id}>
              <button className="card line-card" onClick={() => open(l.id)}>
                <LineBadge id={l.id} />
                <span className="dirs">
                  <strong>
                    {a} ↔ {b}
                  </strong>
                  <span>
                    {sc ? `svakih ${sc.headway} min · ${sc.first}–${sc.last}` : 'danas ne vozi'}
                    {l.notice ? ' · ⚠ obavijest' : ''}
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
