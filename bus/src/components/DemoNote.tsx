// Izvor + datum ažurnosti — obavezno na svakom ekranu s podacima.
import { Clock } from '@/lib/icons';
import { META } from '@/lib/data';

export function DemoNote({ extra }: { extra?: string }) {
  return (
    <p className="demo-note">
      <Clock />
      <span>
        Podaci: {META.source} · ažurirano {META.updated}
        {extra ? ' · ' + extra : ''}
        {META.isDemo ? ' · ' : ''}
        {META.isDemo && <strong>prototip s demo podacima</strong>}
      </span>
    </p>
  );
}
