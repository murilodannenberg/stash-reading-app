import { create } from 'zustand';
import { Highlight } from '../types';
import { HighlightWithArticle } from '../database/repositories/highlights';
import * as db from '../database';

interface HighlightState {
  /** Highlights do artigo aberto no leitor */
  articleHighlights: Highlight[];
  /** Todos os destaques (com título do artigo), para a tela global */
  allHighlights: HighlightWithArticle[];

  loadArticleHighlights: (articleId: string) => Promise<void>;
  loadAllHighlights: () => Promise<void>;

  addHighlight: (params: {
    article_id: string;
    selected_text: string;
    start_offset: number;
    end_offset: number;
  }) => Promise<Highlight>;

  removeHighlight: (id: string) => Promise<void>;
}

export const useHighlightStore = create<HighlightState>((set, get) => ({
  articleHighlights: [],
  allHighlights: [],

  loadArticleHighlights: async (articleId) => {
    const highlights = await db.getHighlights(articleId);
    set({ articleHighlights: highlights });
  },

  loadAllHighlights: async () => {
    const highlights = await db.getAllHighlightsWithArticles();
    set({ allHighlights: highlights });
  },

  addHighlight: async (params) => {
    const highlight = await db.createHighlight(params);
    set((state) => ({
      articleHighlights: [...state.articleHighlights, highlight].sort(
        (a, b) => a.start_offset - b.start_offset,
      ),
    }));
    return highlight;
  },

  removeHighlight: async (id) => {
    await db.deleteHighlight(id);
    set((state) => ({
      articleHighlights: state.articleHighlights.filter((h) => h.id !== id),
      allHighlights: state.allHighlights.filter((h) => h.id !== id),
    }));
  },
}));
