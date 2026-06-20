import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';
import { HOME_THEMES, ACCENT_COLORS, HomeThemeKey } from '../theme/colors';

export interface AppThemePrefs {
  accentColor: string;
  homeTheme: HomeThemeKey;
}

const DEFAULT_APP_THEME: AppThemePrefs = {
  accentColor: ACCENT_COLORS[0],
  homeTheme: 'light',
};

let storage: MMKV | null = null;
const STORAGE_KEY = 'app_theme';

function getStorage(): MMKV {
  if (!storage) storage = new MMKV({ id: 'app-theme' });
  return storage;
}

function loadTheme(): AppThemePrefs {
  try {
    const raw = getStorage().getString(STORAGE_KEY);
    if (!raw) return DEFAULT_APP_THEME;
    return { ...DEFAULT_APP_THEME, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_APP_THEME;
  }
}

function saveTheme(prefs: AppThemePrefs) {
  try {
    getStorage().set(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // MMKV not ready yet
  }
}

interface AppThemeState {
  prefs: AppThemePrefs;
  _hydrate: () => void;
  setAccentColor: (color: string) => void;
  setHomeTheme: (theme: HomeThemeKey) => void;
}

let _hydrated = false;

export const useAppThemeStore = create<AppThemeState>((set) => ({
  prefs: DEFAULT_APP_THEME,

  _hydrate: () => {
    if (_hydrated) return;
    _hydrated = true;
    set({ prefs: loadTheme() });
  },

  setAccentColor: (color) =>
    set((state) => {
      const updated = { ...state.prefs, accentColor: color };
      saveTheme(updated);
      return { prefs: updated };
    }),

  setHomeTheme: (theme) =>
    set((state) => {
      const updated = { ...state.prefs, homeTheme: theme };
      saveTheme(updated);
      return { prefs: updated };
    }),
}));

/** Get resolved home theme colors from a theme key */
export function getHomeColors(key: HomeThemeKey) {
  return HOME_THEMES[key];
}
