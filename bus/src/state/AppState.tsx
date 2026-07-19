// Globalno stanje + jednostavni router (bez URL-a; SPA prikazi + povijest za "Natrag").
// Zamjenjuje `state` i `go/goBack` iz prototipa, ali reaktivno.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { store } from '@/lib/store';
import { autoSchedType, nowMin, toISO } from '@/lib/dates';
import type { SchedType } from '@/lib/types';

export type View = 'home' | 'station' | 'map' | 'lines' | 'line' | 'trip' | 'info';
export type Tab = 'home' | 'lines' | 'info';
export type TextSize = 'normalna' | 'velika' | 'najveca';
export type SchedOverride = 'auto' | SchedType;
export interface Trip {
  a: string;
  b: string;
}

const VIEW_TAB: Record<View, Tab> = {
  home: 'home',
  station: 'home',
  map: 'home',
  trip: 'home',
  lines: 'lines',
  line: 'lines',
  info: 'info',
};

const TIME_VIEWS: View[] = ['home', 'station', 'line', 'trip'];

interface AppContextValue {
  // navigacija
  view: View;
  tab: Tab;
  go: (view: View, push?: boolean) => void;
  goTab: (tab: Tab) => void;
  goBack: () => void;
  openStation: (id: string) => void;

  // odabir
  myStation: string | null;
  setMyStation: (id: string | null) => void;
  station: string | null;
  line: string | null;
  openLine: (id: string, variant?: number, dir?: 0 | 1) => void;
  lineVariant: number;
  setLineVariant: (i: number) => void;
  lineDir: 0 | 1;
  setLineDir: (dir: 0 | 1) => void;

  // vozni red / datum
  schedOverride: SchedOverride;
  setSchedOverride: (v: SchedOverride) => void;
  viewDate: string | null;
  setViewDate: (v: string | null) => void;
  schedType: SchedType;
  isTodayView: boolean;
  viewDateObj: Date;
  effNow: () => number;

  // putovanje
  trip: Trip | null;
  setTrip: (t: Trip | null) => void;
  tripFrom: string | null;
  setTripFrom: (v: string | null) => void;
  tripTo: string | null;
  setTripTo: (v: string | null) => void;

  // karta
  mapFilter: string; // '' = sve linije, inače Line.id
  setMapFilter: (v: string) => void;
  mapSelected: string | null;
  setMapSelected: (v: string | null) => void;

  // stanica — cijeli raspored
  stationShowAll: boolean;
  setStationShowAll: (v: boolean) => void;

  // postavke
  textSize: TextSize;
  setTextSize: (v: TextSize) => void;

  // toast
  toast: (msg: string) => void;
  toastMsg: string | null;

  tick: number;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>('home');
  const [tab, setTab] = useState<Tab>('home');
  const stack = useRef<View[]>([]);
  const viewRef = useRef<View>('home');
  viewRef.current = view;

  const [myStation, setMyStationState] = useState<string | null>(() =>
    store.get('moja-stanica', null),
  );
  const [station, setStation] = useState<string | null>(null);
  const [line, setLineState] = useState<string | null>(null);
  const [lineVariant, setLineVariant] = useState(0);
  const [lineDir, setLineDir] = useState<0 | 1>(0);

  const [schedOverride, setSchedOverrideState] = useState<SchedOverride>(() =>
    store.get('vozni-red', 'auto'),
  );
  const [viewDate, setViewDate] = useState<string | null>(null);

  const [trip, setTripState] = useState<Trip | null>(() => store.get('putovanje', null));
  const [tripFrom, setTripFrom] = useState<string | null>(null);
  const [tripTo, setTripTo] = useState<string | null>(null);

  const [mapFilter, setMapFilter] = useState<string>('');
  const [mapSelected, setMapSelected] = useState<string | null>(null);
  const [stationShowAll, setStationShowAll] = useState<boolean>(false);

  const [textSize, setTextSizeState] = useState<TextSize>(() =>
    store.get('velicina-teksta', 'normalna'),
  );
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [tick, setTick] = useState(0);

  // primijeni veličinu teksta na <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-textsize', textSize);
  }, [textSize]);

  // živa vremena — osvježi svakih 30 s dok gledamo ekran ovisan o vremenu za danas
  useEffect(() => {
    const isToday = !viewDate || viewDate === toISO(new Date());
    if (!isToday || !TIME_VIEWS.includes(view)) return;
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, [view, viewDate]);

  const go = useCallback((next: View, push = true) => {
    const cur = viewRef.current;
    if (push && cur !== next) stack.current.push(cur);
    viewRef.current = next;
    setView(next);
    setTab(VIEW_TAB[next]);
    window.scrollTo(0, 0);
  }, []);

  const goTab = useCallback(
    (t: Tab) => {
      stack.current = [];
      go(t, false);
    },
    [go],
  );

  const goBack = useCallback(() => {
    const prev = stack.current.pop() ?? 'home';
    go(prev, false);
  }, [go]);

  const openStation = useCallback(
    (id: string) => {
      setStation(id);
      setStationShowAll(false);
      go('station');
    },
    [go],
  );

  const openLine = useCallback(
    (id: string, variant = 0, dir: 0 | 1 = 0) => {
      setLineState(id);
      setLineVariant(variant);
      setLineDir(dir);
      go('line');
    },
    [go],
  );

  const setMyStation = useCallback((id: string | null) => {
    setMyStationState(id);
    store.set('moja-stanica', id);
  }, []);

  const setSchedOverride = useCallback((v: SchedOverride) => {
    setSchedOverrideState(v);
    store.set('vozni-red', v);
  }, []);

  const setTrip = useCallback((t: Trip | null) => {
    setTripState(t);
    store.set('putovanje', t);
  }, []);

  const setTextSize = useCallback((v: TextSize) => {
    setTextSizeState(v);
    store.set('velicina-teksta', v);
  }, []);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 3000);
  }, []);

  const viewDateObj = useMemo(
    () => (viewDate ? new Date(viewDate + 'T12:00:00') : new Date()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [viewDate, tick],
  );
  const isTodayView = !viewDate || viewDate === toISO(new Date());
  const schedType: SchedType =
    schedOverride === 'auto' ? autoSchedType(viewDateObj) : schedOverride;
  const effNow = useCallback(() => (isTodayView ? nowMin() : -1), [isTodayView]);

  const value: AppContextValue = {
    view,
    tab,
    go,
    goTab,
    goBack,
    openStation,
    myStation,
    setMyStation,
    station,
    line,
    openLine,
    lineVariant,
    setLineVariant,
    lineDir,
    setLineDir,
    schedOverride,
    setSchedOverride,
    viewDate,
    setViewDate,
    schedType,
    isTodayView,
    viewDateObj,
    effNow,
    trip,
    setTrip,
    tripFrom,
    setTripFrom,
    tripTo,
    setTripTo,
    mapFilter,
    setMapFilter,
    mapSelected,
    setMapSelected,
    stationShowAll,
    setStationShowAll,
    textSize,
    setTextSize,
    toast,
    toastMsg,
    tick,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp mora biti unutar <AppProvider>');
  return ctx;
}
