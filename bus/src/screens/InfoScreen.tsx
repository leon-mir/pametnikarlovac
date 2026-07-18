// Info: veličina teksta, cjenik, obavijesti, o podacima, footer.
import { useApp, type TextSize } from '@/state/AppState';
import { PRICES, META } from '@/lib/data';
import { noticesFor } from '@/lib/schedule';
import { Banner } from '@/components/common';

const SIZES: { v: TextSize; label: string }[] = [
  { v: 'normalna', label: 'Normalna' },
  { v: 'velika', label: 'Velika' },
  { v: 'najveca', label: 'Najveća' },
];

export function InfoScreen() {
  const { textSize, setTextSize, toast } = useApp();
  const notices = noticesFor(null);

  return (
    <div className="wrap">
      <h1 className="screen-title">Info</h1>

      <section className="info-section">
        <h2>Veličina teksta</h2>
        <div className="seg" role="group" aria-label="Veličina teksta">
          {SIZES.map(({ v, label }) => (
            <button
              key={v}
              aria-pressed={textSize === v}
              onClick={() => {
                setTextSize(v);
                toast('Veličina teksta promijenjena');
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="info-section">
        <h2>Cjenik prijevoza</h2>
        <table className="price">
          <thead>
            <tr>
              <th scope="col">Karta</th>
              <th scope="col">Cijena</th>
            </tr>
          </thead>
          <tbody>
            {PRICES.map((p) => (
              <tr key={p.label}>
                <td>{p.label}</td>
                <td>{p.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="info-section">
        <h2>Aktivne obavijesti</h2>
        {notices.length ? (
          notices.map((l) => <Banner key={l.id} line={l} />)
        ) : (
          <p className="subtitle">Trenutno nema obavijesti.</p>
        )}
      </section>

      <section className="info-section">
        <h2>O podacima</h2>
        <div className="card pad" style={{ fontSize: 'var(--pk-fs-body)' }}>
          <p>
            Vozni redovi preuzimaju se s otvorenih podataka Grada Karlovca ({META.source}). Zadnje
            ažuriranje: <strong>{META.updated}</strong>
          </p>
          {META.isDemo && (
            <p style={{ marginTop: 8, color: 'var(--pk-text-muted)' }}>
              Ovo je prototip s demo podacima — vremena nisu stvarna.
            </p>
          )}
          <p style={{ marginTop: 8 }}>
            <a href="mailto:bus@pametnikarlovac.hr">Prijavi grešku u podacima</a>
          </p>
        </div>
      </section>

      <div className="brand-lockup">
        <img src="/logo.png" alt="Pametni Karlovac" width={880} height={444} />
      </div>

      <footer className="pk-footer">
        🤖 Izrađeno uz pomoć AI-a ·{' '}
        <a href="https://github.com/pametni-karlovac" rel="noopener">
          otvoreni kod na GitHubu
        </a>{' '}
        · pametnikarlovac.hr
        <br />
        Podaci: {META.source} · ažurirano {META.updated}
      </footer>
    </div>
  );
}
