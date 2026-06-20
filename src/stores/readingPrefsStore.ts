import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';
import { ReadingPreferences } from '../types';
import { DEFAULT_READING_PREFS, READING_THEMES, ReadingThemeKey } from '../theme/reading';

let storage: MMKV | null = null;
const STORAGE_KEY = 'reading_prefs';

function getStorage(): MMKV {
  if (!storage) {
    storage = new MMKV({ id: 'reading-prefs' });
  }
  return storage;
}

function loadPrefs(): ReadingPreferences {
  try {
    const raw = getStorage().getString(STORAGE_KEY);
    if (!raw) return DEFAULT_READING_PREFS;
    return { ...DEFAULT_READING_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_READING_PREFS;
  }
}

function savePrefs(prefs: ReadingPreferences) {
  try {
    getStorage().set(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // MMKV not ready yet — prefs will persist on next save
  }
}

interface ReadingPrefsState {
  prefs: ReadingPreferences;
  _hydrate: () => void;
  setFontSize: (size: number) => void;
  setFontFamily: (family: string) => void;
  setTheme: (theme: ReadingThemeKey) => void;
  setLineHeight: (height: number) => void;
}

let _hydrated = false;

export const useReadingPrefsStore = create<ReadingPrefsState>((set) => ({
  prefs: DEFAULT_READING_PREFS,

  _hydrate: () => {
    if (_hydrated) return;
    _hydrated = true;
    set({ prefs: loadPrefs() });
  },

  setFontSize: (size) =>
    set((state) => {
      const updated = { ...state.prefs, fontSize: size };
      savePrefs(updated);
      return { prefs: updated };
    }),

  setFontFamily: (family) =>
    set((state) => {
      const updated = { ...state.prefs, fontFamily: family };
      savePrefs(updated);
      return { prefs: updated };
    }),

  setTheme: (theme) =>
    set((state) => {
      const t = READING_THEMES[theme];
      const updated = { ...state.prefs, backgroundColor: t.backgroundColor, textColor: t.textColor };
      savePrefs(updated);
      return { prefs: updated };
    }),

  setLineHeight: (height) =>
    set((state) => {
      const updated = { ...state.prefs, lineHeight: height };
      savePrefs(updated);
      return { prefs: updated };
    }),
}));
