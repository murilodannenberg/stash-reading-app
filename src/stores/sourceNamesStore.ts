import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';

let storage: MMKV | null = null;
const STORAGE_KEY = 'source_names';

function getStorage(): MMKV {
  if (!storage) storage = new MMKV({ id: 'source-names' });
  return storage;
}

function loadNames(): Record<string, string> {
  try {
    const raw = getStorage().getString(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function saveNames(names: Record<string, string>) {
  try {
    getStorage().set(STORAGE_KEY, JSON.stringify(names));
  } catch {}
}

interface SourceNamesState {
  names: Record<string, string>;
  _hydrate: () => void;
  setName: (domain: string, name: string) => void;
  removeName: (domain: string) => void;
}

let _hydrated = false;

export const useSourceNamesStore = create<SourceNamesState>((set, get) => ({
  names: {},

  _hydrate: () => {
    if (_hydrated) return;
    _hydrated = true;
    set({ names: loadNames() });
  },

  setName: (domain, name) => {
    const trimmed = name.trim();
    set((state) => {
      const updated = trimmed
        ? { ...state.names, [domain]: trimmed }
        : (() => { const c = { ...state.names }; delete c[domain]; return c; })();
      saveNames(updated);
      return { names: updated };
    });
  },

  removeName: (domain) => {
    const updated = { ...get().names };
    delete updated[domain];
    saveNames(updated);
    set({ names: updated });
  },
}));
