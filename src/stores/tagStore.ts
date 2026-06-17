import { create } from 'zustand';
import { Tag } from '../types';
import * as db from '../database';

interface TagState {
  tags: Tag[];
  loading: boolean;
  // Actions
  loadTags: () => Promise<void>;
  createTag: (name: string, color?: string) => Promise<Tag>;
  updateTag: (id: string, name: string, color: string) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
}

export const useTagStore = create<TagState>((set) => ({
  tags: [],
  loading: false,

  loadTags: async () => {
    set({ loading: true });
    try {
      const tags = await db.getTags();
      set({ tags });
    } finally {
      set({ loading: false });
    }
  },

  createTag: async (name, color) => {
    const tag = await db.createTag(name, color);
    set((state) => ({ tags: [...state.tags, tag] }));
    return tag;
  },

  updateTag: async (id, name, color) => {
    await db.updateTag(id, name, color);
    set((state) => ({
      tags: state.tags.map((t) => (t.id === id ? { ...t, name, color } : t)),
    }));
  },

  deleteTag: async (id) => {
    await db.deleteTag(id);
    set((state) => ({ tags: state.tags.filter((t) => t.id !== id) }));
  },
}));
