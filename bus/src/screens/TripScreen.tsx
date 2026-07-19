// Planer rute — upiši polazište i odredište; dobij izravne linije ili vezu s jednim presjedanjem.
import { useApp } from '@/state/AppState';
import { STATIONS, stationById } from '@/lib/data';
import { planTrip } from '@/lib/schedule';
import { fmt, fmtDate } from '@/lib/dates';
import { Eta, LineBadge } from '@/components/common';
import { BackButton } from '@/components/BackButton';
import { DemoNote } from '@/components/DemoNote';
import { Pin, Star, Swap, Chevron } from '@/lib/icons';
import type { Itinerary } from '@/lib/types';

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
        <h1 className="screen-title">Planer rute</h1>
        <p className="subtitle">
          Odaberi polazište i odredište · {isTodayView ? 'danas' : fmtDate(viewDateObj)}
        </p>
      </div>

      <StationSelect id="trip-from" label="Polazište" value={a} onChange={setTripFrom} />
      <button className="swap-btn" aria-label="Zamijeni polazište i odredište" onClick={swap}>
        <Swap /> Zamijeni
      </button>
      <StationSelect id="trip-to" label="Odredište" value={b} onChange={setTripTo} />

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
          const tamo = planTrip(a, b, schedType, now, 4);
          const natrag = planTrip(b, a, schedType, now, 4);
          const isSaved = !!trip && trip.a === a && trip.b === b;
          return (
            <>
              <TripDir title={`Tamo · ${A.name} → ${B.name}`} plan={tamo} />
              <TripDir title={`Natrag · ${B.name} → ${A.name}`} plan={natrag} />
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
            <strong>Kamo putuješ?</strong> Odaberi polazište i odredište — pokazat ću ti koje linije voze i
            kada, po potrebi i s jednim presjedanjem.
          </div>
        );
      })()}

      <DemoNote />
    </div>
  );
}

function TripDir({ title, plan }: { title: string; plan: ReturnType<typeof planTrip> }) {
  const { isTodayView } = useApp();
  return (
    <div className="card pad">
      <p className="eyebrow">{title}</p>
      {!plan.itineraries.length ? (
        <p className="subtitle" style={{ marginTop: 8 }}>
          {isTodayView
            ? 'Nema više polazaka danas (ni s presjedanjem).'
            : 'Taj dan nema veze u ovom smjeru.'}
        </p>
      ) : (
        <>
          {!plan.direct && (
            <p className="subtitle" style={{ marginTop: 0 }}>
              Nema izravne linije — prikazujem vezu s jednim presjedanjem.
            </p>
          )}
          <ul className="dep-list flat">
            {plan.itineraries.map((it, i) => (
              <li key={i}>
                <ItinRow it={it} first={i === 0} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function ItinRow({ it, first }: { it: Itinerary; first?: boolean }) {
  const total = it.arrive - it.depart;
  if (it.legs.length === 1) {
    const l = it.legs[0];
    return (
      <div className={'dep-row' + (first ? ' first' : '')}>
        <LineBadge line={l.line} />
        <div className="dep-main">
          <div className="dep-dir">
            {fmt(l.depart)} → {stationById(l.toId)?.name}
          </div>
          <div className="dep-time">
            linija {l.line.label} · dolazak {fmt(l.arrive)} · {total} min
          </div>
        </div>
        <Eta time={l.depart} />
      </div>
    );
  }
  const [l1, l2] = it.legs;
  return (
    <div className={'itin' + (first ? ' first' : '')}>
      <div className="itin-legs">
        <span className="itin-leg">
          <LineBadge line={l1.line} size={30} />
          <span className="txt">
            <b>{fmt(l1.depart)}</b> {stationById(l1.fromId)?.name}
          </span>
        </span>
        <span className="itin-transfer">
          <Chevron size={16} /> presjedanje u {stationById(it.transferId)?.name} ({fmt(l1.arrive)})
        </span>
        <span className="itin-leg">
          <LineBadge line={l2.line} size={30} />
          <span className="txt">
            <b>{fmt(l2.depart)}</b> {stationById(l2.fromId)?.name} → {stationById(l2.toId)?.name} ({fmt(l2.arrive)})
          </span>
        </span>
      </div>
      <Eta time={it.depart} />
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
