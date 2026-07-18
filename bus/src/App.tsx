import { lazy, Suspense } from 'react';
import { useApp } from './state/AppState';
import { Header } from './components/Header';
import { TabBar } from './components/TabBar';
import { Toast } from './components/common';
import { HomeScreen } from './screens/HomeScreen';
import { StationScreen } from './screens/StationScreen';
import { LinesScreen } from './screens/LinesScreen';
import { LineScreen } from './screens/LineScreen';
import { TripScreen } from './screens/TripScreen';
import { InfoScreen } from './screens/InfoScreen';

// Karta (Leaflet) se učitava tek kad zatreba — manji početni bundle za jeftine telefone.
const MapScreen = lazy(() =>
  import('./screens/MapScreen').then((m) => ({ default: m.MapScreen })),
);

export function App() {
  const { view } = useApp();
  return (
    <div className="app">
      <Header />
      <main>
        {view === 'home' && <HomeScreen />}
        {view === 'station' && <StationScreen />}
        {view === 'lines' && <LinesScreen />}
        {view === 'line' && <LineScreen />}
        {view === 'trip' && <TripScreen />}
        {view === 'info' && <InfoScreen />}
        {view === 'map' && (
          <Suspense fallback={<div className="wrap" aria-busy="true" />}>
            <MapScreen />
          </Suspense>
        )}
      </main>
      <TabBar />
      <Toast />
    </div>
  );
}
