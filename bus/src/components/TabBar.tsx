// Donja navigacija — točno 3 taba (Stanica / Linije / Info). Bez hamburgera.
import { useApp, type Tab } from '@/state/AppState';
import { TabStation, TabLines, TabInfo } from '@/lib/icons';

const TABS: { tab: Tab; label: string; Icon: typeof TabStation }[] = [
  { tab: 'home', label: 'Stanica', Icon: TabStation },
  { tab: 'lines', label: 'Linije', Icon: TabLines },
  { tab: 'info', label: 'Info', Icon: TabInfo },
];

export function TabBar() {
  const { tab, goTab } = useApp();
  return (
    <nav className="tabbar" aria-label="Glavna navigacija">
      {TABS.map(({ tab: t, label, Icon }) => (
        <button
          key={t}
          aria-current={tab === t ? 'page' : undefined}
          onClick={() => goTab(t)}
        >
          <Icon />
          {label}
        </button>
      ))}
    </nav>
  );
}
