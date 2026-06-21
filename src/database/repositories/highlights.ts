import { getDatabase } from '../connection';
import { Highlight } from '../../types';
import { generateId, nowISO } from '../../utils/id';

export type HighlightWithArticle = Highlight & { article_title: string };

export async function getHighlights(articleId: string): Promise<Highlight[]> {
  const db = getDatabase();
  return db.getAllAsync<Highlight>(
    'SELECT * FROM highlights WHERE deleted_at IS NULL AND article_id = ? ORDER BY start_offset ASC',
    [articleId],
  );
}

export async function getAllHighlightsWithArticles(): Promise<HighlightWithArticle[]> {
  const db = getDatabase();
  return db.getAllAsync<HighlightWithArticle>(
    `SELECT h.*, a.title AS article_title
     FROM highlights h
     JOIN articles a ON h.article_id = a.id
     WHERE h.deleted_at IS NULL
     ORDER BY h.created_at DESC`,
  );
}

export async function createHighlight(params: {
  article_id: string;
  selected_text: string;
  start_offset: number;
  end_offset: number;
  color?: string;
  note?: string | null;
}): Promise<Highlight> {
  const db = getDatabase();
  const id = generateId();
  const now = nowISO();
  const color = params.color ?? '#fde047';
  const note = params.note ?? null;
  await db.runAsync(
    `INSERT INTO highlights
      (id, article_id, selected_text, start_offset, end_offset, color, note, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, params.article_id, params.selected_text, params.start_offset, params.end_offset, color, note, now, now],
  );
  return {
    id,
    article_id: params.article_id,
    selected_text: params.selected_text,
    start_offset: params.start_offset,
    end_offset: params.end_offset,
    color,
    note,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };
}

export async function deleteHighlight(id: string): Promise<void> {
  const db = getDatabase();
  await db.runAsync('UPDATE highlights SET deleted_at = ? WHERE id = ?', [nowISO(), id]);
}
