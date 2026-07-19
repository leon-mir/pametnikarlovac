// Info: veličina teksta, cjenik, obavijesti, o podacima, footer.
import { useApp, type TextSize } from '@/state/AppState';
import { PRICES, META } from '@/lib/data';
import { noticesFor } from '@/lib/schedule';
import { NoticeBanners } from '@/components/common';

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
        <p className="subtitle" style={{ marginTop: 0 }}>
          Cijena karte ovisi o zoni (udaljenosti). Vrijedi od {PRICES.vrijediOd}
          {PRICES.pdvUkljucen ? ' · PDV uključen' : ''}.
        </p>
        <div className="table-scroll">
          <table className="price">
            <thead>
              <tr>
                <th scope="col">Zona</th>
                <th scope="col">Udaljenost</th>
                <th scope="col">Jednokratna</th>
                <th scope="col">Dnevna</th>
                <th scope="col">Mjesečna</th>
              </tr>
            </thead>
            <tbody>
              {PRICES.zone.map((z) => (
                <tr key={z.zona}>
                  <td>
                    <strong>{z.zona}</strong>
                  </td>
                  <td>{z.km} km</td>
                  <td>{z.jednokratna}</td>
                  <td>{z.dnevna}</td>
                  <td>{z.mjesecna}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="price-note">
          <strong>65+:</strong> {PRICES.besplatno}
        </p>
        <p className="subtitle">{PRICES.napomena}</p>
        <p>
          <a href={PRICES.pdfUrl} target="_blank" rel="noopener">
            Službeni cjenik (PDF) — mjesečne učeničke/studentske i umirovljeničke karte
          </a>
        </p>
      </section>

      <section className="info-section">
        <h2>Aktivne obavijesti</h2>
        {notices.length ? (
          <NoticeBanners lines={notices} />
        ) : (
          <p className="subtitle">Trenutno nema obavijesti.</p>
        )}
      </section>

      <section className="info-section">
        <h2>O podacima</h2>
        <div className="card pad" style={{ fontSize: 'var(--pk-fs-body)' }}>
          <p>
            Vozni redovi, trase i obavijesti preuzimaju se s otvorenih podataka Grada Karlovca (
            {META.source}) i osvježavaju automatski. Zadnje ažuriranje: <strong>{META.updated}</strong>.
          </p>
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
