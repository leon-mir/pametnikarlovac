// Planer rute (puni ekran) — isti kalkulator kao na naslovnici, dostupan i sa stanice.
import { useApp } from '@/state/AppState';
import { fmtDate } from '@/lib/dates';
import { RoutePlanner } from '@/components/RoutePlanner';
import { BackButton } from '@/components/BackButton';
import { DemoNote } from '@/components/DemoNote';

export function TripScreen() {
  const { isTodayView, viewDateObj } = useApp();
  return (
    <div className="wrap">
      <BackButton />
      <div>
        <h1 className="screen-title">Planer rute</h1>
        <p className="subtitle">
          Od kuda do kuda · {isTodayView ? 'danas' : fmtDate(viewDateObj)}
        </p>
      </div>
      <RoutePlanner />
      <DemoNote />
    </div>
  );
}
