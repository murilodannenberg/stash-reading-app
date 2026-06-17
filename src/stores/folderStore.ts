import { create } from 'zustand';
import { Folder } from '../types';
import * as db from '../database';

interface FolderState {
  folders: Folder[];
  loading: boolean;
  // Actions
  loadFolders: (parentId?: string | null) => Promise<void>;
  createFolder: (name: string, parentId?: string | null) => Promise<Folder>;
  updateFolder: (id: string, name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
}

export const useFolderStore = create<FolderState>((set) => ({
  folders: [],
  loading: false,

  loadFolders: async (parentId = null) => {
    set({ loading: true });
    try {
      const folders = await db.getFolders(parentId);
      set({ folders });
    } finally {
      set({ loading: false });
    }
  },

  createFolder: async (name, parentId = null) => {
    const folder = await db.createFolder(name, parentId);
    set((state) => ({ folders: [...state.folders, folder] }));
    return folder;
  },

  updateFolder: async (id, name) => {
    await db.updateFolder(id, name);
    set((state) => ({
      folders: state.folders.map((f) => (f.id === id ? { ...f, name } : f)),
    }));
  },

  deleteFolder: async (id) => {
    await db.deleteFolder(id);
    set((state) => ({ folders: state.folders.filter((f) => f.id !== id) }));
  },
}));
