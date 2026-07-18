// Putovanje tamo-natrag — odabir dvije stanice, izravne veze u oba smjera, spremi na početni.
import { useApp } from '@/state/AppState';
import { STATIONS, stationById } from '@/lib/data';
import { tripConnections } from '@/lib/schedule';
import { fmt, fmtDate } from '@/lib/dates';
import { Eta } from '@/components/common';
import { BackButton } from '@/components/BackButton';
import { DemoNote } from '@/components/DemoNote';
import { LineBadge } from '@/components/common';
import { Pin, Star, Swap } from '@/lib/icons';
import type { Connection } from '@/lib/types';

export function TripScreen() {
  const {
    tripFrom: a,
    tripTo: b,
    setTripFrom,
    setTripTo,
    trip,
    setTrip,
    schedType,
    isTodayView,
    viewDateObj,
    effNow,
    toast,
  } = useApp();
  const now = effNow();

  const swap = () => {
    setTripFrom(b);
    setTripTo(a);
  };

  return (
    <div className="wrap">
      <BackButton />
      <div>
        <h1 className="screen-title">Putovanje</h1>
        <p className="subtitle">
          Polasci tamo i natrag · {isTodayView ? 'danas' : fmtDate(viewDateObj)}
        </p>
      </div>

      <StationSelect id="trip-from" label="Od stanice" value={a} onChange={setTripFrom} />
      <button className="swap-btn" aria-label="Zamijeni smjer" onClick={swap}>
        <Swap /> Zamijeni smjer
      </button>
      <StationSelect id="trip-to" label="Do stanice" value={b} onChange={setTripTo} />

      {(() => {
        if (a && b && a === b) {
          return (
            <div className="card pad empty">
              <strong>Odaberi dvije različite stanice.</strong>
            </div>
          );
        }
        if (a && b) {
          const A = stationById(a)!;
          const B = stationById(b)!;
          const tamo = tripConnections(a, b, schedType, now, 3);
          const natrag = tripConnections(b, a, schedType, now, 3);
          const anyDirect =
            tripConnections(a, b, schedType, now).length ||
            tripConnections(b, a, schedType, now).length;
          if (!anyDirect) {
            return (
              <div className="card pad empty">
                <strong>Nema izravne linije.</strong>
                Između ovih stanica nema izravne veze — pogledaj kartu linija.
              </div>
            );
          }
          const isSaved = !!trip && trip.a === a && trip.b === b;
          return (
            <>
              <div className="card pad">
                <p className="eyebrow">
                  Tamo · {A.name} → {B.name}
                </p>
                <TripLeg deps={tamo} toName={B.name} />
              </div>
              <div className="card pad">
                <p className="eyebrow">
                  Natrag · {B.name} → {A.name}
                </p>
                <TripLeg deps={natrag} toName={A.name} />
              </div>
              <button
                className={'btn ' + (isSaved ? 'btn-secondary' : 'btn-primary')}
                onClick={() => {
                  if (isSaved) {
                    setTrip(null);
                    toast('Putovanje uklonjeno');
                  } else {
                    setTrip({ a, b });
                    toast('Putovanje spremljeno ✓');
                  }
                }}
              >
                <Star filled={isSaved} />{' '}
                {isSaved ? 'Putovanje spremljeno ✓ (ukloni)' : 'Spremi na početni ekran'}
              </button>
            </>
          );
        }
        return (
          <div className="card pad empty">
            <strong>Kamo putuješ?</strong>
            Odaberi polaznu i odredišnu stanicu — pokazat ću ti polaske tamo i natrag.
          </div>
        );
      })()}

      <DemoNote />
    </div>
  );
}

function StationSelect({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <div className="select-box">
        <Pin />
        <select id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
          <option value="">Odaberi stanicu…</option>
          {STATIONS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function TripLeg({ deps, toName }: { deps: Connection[]; toName: string }) {
  const { isTodayView } = useApp();
  if (!deps.length) {
    return (
      <p className="subtitle" style={{ marginTop: 8 }}>
        {isTodayView
          ? 'Nema više polazaka danas u ovom smjeru.'
          : 'Taj dan nema polazaka u ovom smjeru.'}
      </p>
    );
  }
  return (
    <ul className="dep-list flat">
      {deps.map((d, i) => (
        <li key={i}>
          <div className={'dep-row' + (i === 0 ? ' first' : '')}>
            <LineBadge id={d.line.id} />
            <div className="dep-main">
              <div className="dep-dir">
                {fmt(d.time)} → {toName}
              </div>
              <div className="dep-time">
                linija {d.line.id} · dolazak u {fmt(d.arrive)} · vožnja {d.arrive - d.time} min
              </div>
            </div>
            <Eta time={d.time} />
          </div>
        </li>
      ))}
    </ul>
  );
}
