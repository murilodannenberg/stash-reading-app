import { create } from 'zustand';
import { StashFile } from '../types';
import * as db from '../database';

interface FileState {
  files: StashFile[];
  loading: boolean;
  loadFiles: (folderId?: string | null) => Promise<void>;
  importFile: (params: {
    name: string;
    type: import('../types').FileType;
    path: string;
    size_bytes: number;
    folder_id: string | null;
  }) => Promise<StashFile>;
  deleteFile: (id: string, localPath: string) => Promise<void>;
}

export const useFileStore = create<FileState>((set) => ({
  files: [],
  loading: false,

  loadFiles: async (folderId) => {
    set({ loading: true });
    try {
      const files = await db.getFiles(folderId);
      set({ files });
    } finally {
      set({ loading: false });
    }
  },

  importFile: async (params) => {
    const file = await db.createFile(params);
    set((state) => ({ files: [file, ...state.files] }));
    return file;
  },

  deleteFile: async (id, localPath) => {
    await db.deleteFile(id);
    await db.deleteFileFromStorage(localPath);
    set((state) => ({ files: state.files.filter((f) => f.id !== id) }));
  },
}));
