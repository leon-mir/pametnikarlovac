// localStorage omotač (bez računa, bez trackinga). Tolerira privatni mod.
const PREFIX = 'pkbus-';

export const store = {
  get<T>(key: string, fallback: T): T {
    try {
      const v = localStorage.getItem(PREFIX + key);
      return v === null ? fallback : (JSON.parse(v) as T);
    } catch {
      return fallback;
    }
  },
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* privatni mod / puna kvota — tiho preskoči */
    }
  },
};
