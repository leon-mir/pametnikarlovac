// Zaglavlje + "chip" za odabir voznog reda (dan i tip). Popover se zatvara klikom izvan.
import { useEffect, useRef, useState } from 'react';
import { useApp, type SchedOverride } from '@/state/AppState';
import { autoSchedType, DAYS_HR, fmtDate, SCHED_LABEL, toISO } from '@/lib/dates';
import { Calendar, Check, StarLogo } from '@/lib/icons';
import type { SchedType } from '@/lib/types';

const TYPE_OPTS: [SchedOverride, string][] = [
  ['radni', 'Radni dan'],
  ['subota', 'Subota'],
  ['nedjelja', 'Nedjelja i blagdan'],
];

export function Header() {
  const {
    schedOverride,
    setSchedOverride,
    viewDate,
    setViewDate,
    schedType,
    isTodayView,
    viewDateObj,
  } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, [open]);

  const d = viewDateObj;
  const dateLbl = isTodayView
    ? 'Danas'
    : DAYS_HR[d.getDay()].slice(0, 3) + ' ' + d.getDate() + '.' + (d.getMonth() + 1) + '.';
  const chipLabel =
    dateLbl +
    ' · ' +
    SCHED_LABEL[schedType].split(' ')[0] +
    (schedOverride !== 'auto' ? ' ✱' : '');

  const today = new Date();
  const tomorrow = new Date(Date.now() + 86400000);
  const isDanas = !viewDate || viewDate === toISO(today);
  const isSutra = viewDate === toISO(tomorrow);
  const isCustom = !!viewDate && !isDanas && !isSutra;

  const pickDate = (v: string | null) => {
    setViewDate(v);
    setOpen(false);
  };
  const pickSched = (v: SchedOverride) => {
    setSchedOverride(v);
    setOpen(false);
  };

  const autoType: SchedType = autoSchedType(d);

  return (
    <header className="pk-header on-dark">
      <span className="logo">
        <StarLogo />
      </span>
      <div className="title">
        Bus<small>Pametni Karlovac</small>
      </div>

      <div ref={ref} style={{ marginLeft: 'auto', position: 'relative', flexShrink: 0 }}>
        <button
          className="sched-chip"
          aria-haspopup="true"
          aria-expanded={open}
          aria-label="Odaberi vozni red"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((o) => !o);
          }}
        >
          <Calendar />
          <span>{chipLabel}</span>
        </button>

        {open && (
          <div className="sched-pop" role="menu" aria-label="Vozni red">
            <p className="pop-title">Za koji dan?</p>
            <button role="menuitemradio" aria-pressed={isDanas} onClick={() => pickDate(null)}>
              {isDanas ? <Check /> : <Spacer />} Danas — {fmtDate(today)}
            </button>
            <button
              role="menuitemradio"
              aria-pressed={isSutra}
              onClick={() => pickDate(toISO(tomorrow))}
            >
              {isSutra ? <Check /> : <Spacer />} Sutra — {fmtDate(tomorrow)}
            </button>
            <label className="pop-date">
              {isCustom ? <Check /> : <Spacer />}
              <span>Drugi datum</span>
              <input
                type="date"
                value={viewDate || toISO(today)}
                min={toISO(today)}
                aria-label="Odaberi datum"
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  if (e.target.value) {
                    pickDate(e.target.value === toISO(today) ? null : e.target.value);
                  }
                }}
              />
            </label>

            <p className="pop-title">Vozni red</p>
            <button
              role="menuitemradio"
              aria-pressed={schedOverride === 'auto'}
              onClick={() => pickSched('auto')}
            >
              {schedOverride === 'auto' ? <Check /> : <Spacer />} Prema datumu:{' '}
              {SCHED_LABEL[autoType].toLowerCase()}
            </button>
            {TYPE_OPTS.map(([v, label]) => (
              <button
                key={v}
                role="menuitemradio"
                aria-pressed={schedOverride === v}
                onClick={() => pickSched(v)}
              >
                {schedOverride === v ? <Check /> : <Spacer />} {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

const Spacer = () => <span style={{ display: 'inline-block', width: 18 }} aria-hidden />;
