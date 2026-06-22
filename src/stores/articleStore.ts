import { create } from 'zustand';
import { Article } from '../types';
import * as db from '../database';
import { downloadArticleImages, deleteArticleImages, clearAllArticleImages } from '../services/imageStorage';

interface ArticleState {
  articles: Article[];
  loading: boolean;
  // Load
  loadArticles: (folderId?: string | null) => Promise<void>;
  loadFavorites: () => Promise<void>;
  loadArchivedArticles: () => Promise<void>;
  loadArticlesByTag: (tagId: string) => Promise<void>;
  // Article lifecycle
  trashArticle: (id: string) => Promise<void>;
  restoreArticle: (id: string) => Promise<void>;
  permanentlyDeleteArticle: (id: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
  archiveArticle: (id: string) => Promise<void>;
  unarchiveArticle: (id: string) => Promise<void>;
  // Other mutations
  markAsRead: (id: string, isRead: boolean) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  downloadArticle: (id: string) => Promise<number>;
  removeDownload: (id: string) => Promise<void>;
  clearAllDownloads: () => Promise<void>;
  searchArticles: (query: string) => Promise<Article[]>;
  // Trash list (separate from main articles list)
  trashArticles: Article[];
  loadTrash: () => Promise<void>;
}

export const useArticleStore = create<ArticleState>((set, get) => ({
  articles: [],
  trashArticles: [],
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

  loadArchivedArticles: async () => {
    set({ loading: true });
    try {
      const articles = await db.getArchivedArticles();
      set({ articles });
    } finally {
      set({ loading: false });
    }
  },

  loadTrash: async () => {
    const trashArticles = await db.getTrashArticles();
    set({ trashArticles });
  },

  trashArticle: async (id) => {
    await db.deleteArticle(id);
    set((state) => ({ articles: state.articles.filter((a) => a.id !== id) }));
  },

  restoreArticle: async (id) => {
    await db.restoreArticle(id);
    set((state) => ({
      trashArticles: state.trashArticles.filter((a) => a.id !== id),
    }));
  },

  permanentlyDeleteArticle: async (id) => {
    await db.permanentlyDeleteArticle(id);
    set((state) => ({
      trashArticles: state.trashArticles.filter((a) => a.id !== id),
    }));
  },

  emptyTrash: async () => {
    await db.emptyTrash();
    set({ trashArticles: [] });
  },

  archiveArticle: async (id) => {
    await db.archiveArticle(id);
    set((state) => ({ articles: state.articles.filter((a) => a.id !== id) }));
  },

  unarchiveArticle: async (id) => {
    await db.unarchiveArticle(id);
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

  downloadArticle: async (id) => {
    const article = await db.getArticleById(id);
    if (!article || !article.content_html) return 0;
    const { html, count } = await downloadArticleImages(id, article.content_html);
    await db.setArticleDownloaded(id, html);
    set((state) => ({
      articles: state.articles.map((a) =>
        a.id === id ? { ...a, content_html_local: html, is_downloaded: true } : a
      ),
    }));
    return count;
  },

  removeDownload: async (id) => {
    await db.clearArticleDownload(id);
    await deleteArticleImages(id);
    set((state) => ({
      articles: state.articles.map((a) =>
        a.id === id ? { ...a, content_html_local: null, is_downloaded: false } : a
      ),
    }));
  },

  clearAllDownloads: async () => {
    await db.clearAllArticleDownloads();
    await clearAllArticleImages();
    set((state) => ({
      articles: state.articles.map((a) =>
        a.is_downloaded ? { ...a, content_html_local: null, is_downloaded: false } : a
      ),
    }));
  },

  searchArticles: async (query) => {
    return db.searchArticles(query);
  },

  loadArticlesByTag: async (tagId) => {
    set({ loading: true });
    try {
      const articles = await db.getArticlesByTag(tagId);
      set({ articles });
    } finally {
      set({ loading: false });
    }
  },
}));
