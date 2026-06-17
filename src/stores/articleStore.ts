import { create } from 'zustand';
import { Article } from '../types';
import * as db from '../database';

interface ArticleState {
  articles: Article[];
  loading: boolean;
  // Actions
  loadArticles: (folderId?: string | null) => Promise<void>;
  loadFavorites: () => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
  markAsRead: (id: string, isRead: boolean) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  searchArticles: (query: string) => Promise<Article[]>;
}

export const useArticleStore = create<ArticleState>((set, get) => ({
  articles: [],
  loading: false,

  loadArticles: async (folderId) => {
    set({ loading: true });
    try {
      const articles = await db.getArticles(folderId);
      set({ articles });
    } finally {
      set({ loading: false });
    }
  },

  loadFavorites: async () => {
    set({ loading: true });
    try {
      const articles = await db.getFavoriteArticles();
      set({ articles });
    } finally {
      set({ loading: false });
    }
  },

  deleteArticle: async (id) => {
    await db.deleteArticle(id);
    set((state) => ({ articles: state.articles.filter((a) => a.id !== id) }));
  },

  markAsRead: async (id, isRead) => {
    await db.markAsRead(id, isRead);
    set((state) => ({
      articles: state.articles.map((a) =>
        a.id === id ? { ...a, is_read: isRead } : a
      ),
    }));
  },

  toggleFavorite: async (id) => {
    const article = get().articles.find((a) => a.id === id);
    if (!article) return;
    const newValue = !article.is_favorite;
    await db.toggleFavorite(id, newValue);
    set((state) => ({
      articles: state.articles.map((a) =>
        a.id === id ? { ...a, is_favorite: newValue } : a
      ),
    }));
  },

  searchArticles: async (query) => {
    return db.searchArticles(query);
  },
}));
