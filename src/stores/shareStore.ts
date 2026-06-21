import { create } from 'zustand';

interface ShareState {
  /** URL pendente recebida via share intent, aguardando navegação. */
  pendingUrl: string | null;
  setPendingUrl: (url: string | null) => void;
}

export const useShareStore = create<ShareState>((set) => ({
  pendingUrl: null,
  setPendingUrl: (url) => set({ pendingUrl: url }),
}));
