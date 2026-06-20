import { getDatabase } from '../connection';
import { Article } from '../../types';
import { generateId, nowISO } from '../../utils/id';

type CreateArticleInput = Pick<
  Article,
  'title' | 'url' | 'content_html' | 'content_text' | 'author' |
  'published_at' | 'cover_image_path' | 'reading_time_min' | 'folder_id'
>;

function rowToArticle(row: Record<string, unknown>): Article {
  return {
    ...(row as unknown as Article),
    is_read: Boolean(row['is_read']),
    is_favorite: Boolean(row['is_favorite']),
  };
}

export async function getArticles(folderId?: string | null): Promise<Article[]> {
  const db = getDatabase();
  let rows: Record<string, unknown>[];
  if (folderId !== undefined) {
    rows = await db.getAllAsync(
      `SELECT * FROM articles
       WHERE deleted_at IS NULL AND folder_id IS ?
       ORDER BY updated_at DESC`,
      [folderId]
    );
  } else {
    rows = await db.getAllAsync(
      'SELECT * FROM articles WHERE deleted_at IS NULL ORDER BY updated_at DESC'
    );
  }
  return rows.map(rowToArticle);
}

export async function getArticleById(id: string): Promise<Article | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM articles WHERE id = ? AND deleted_at IS NULL',
    [id]
  );
  return row ? rowToArticle(row) : null;
}

export async function getFavoriteArticles(): Promise<Article[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM articles WHERE is_favorite = 1 AND deleted_at IS NULL ORDER BY updated_at DESC'
  );
  return rows.map(rowToArticle);
}

export async function createArticle(input: CreateArticleInput): Promise<Article> {
  const db = getDatabase();
  const id = generateId();
  const now = nowISO();
  await db.runAsync(
    `INSERT INTO articles
       (id, folder_id, title, url, content_html, content_text, author,
        published_at, cover_image_path, reading_time_min, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, input.folder_id ?? null, input.title, input.url ?? null,
      input.content_html ?? null, input.content_text ?? null,
      input.author ?? null, input.published_at ?? null,
      input.cover_image_path ?? null, input.reading_time_min ?? null,
      now, now,
    ]
  );
  return {
    id, ...input,
    folder_id: input.folder_id ?? null,
    is_read: false,
    is_favorite: false,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };
}

export async function markAsRead(id: string, isRead: boolean): Promise<void> {
  const db = getDatabase();
  await db.runAsync('UPDATE articles SET is_read = ? WHERE id = ?', [isRead ? 1 : 0, id]);
}

export async function toggleFavorite(id: string, isFavorite: boolean): Promise<void> {
  const db = getDatabase();
  await db.runAsync('UPDATE articles SET is_favorite = ? WHERE id = ?', [isFavorite ? 1 : 0, id]);
}

export async function deleteArticle(id: string): Promise<void> {
  const db = getDatabase();
  const now = nowISO();
  await db.runAsync(
    'UPDATE articles SET deleted_at = ?, updated_at = ? WHERE id = ?',
    [now, now, id]
  );
}

export async function searchArticles(query: string): Promise<Article[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT a.* FROM articles a
     JOIN articles_fts fts ON a.rowid = fts.rowid
     WHERE articles_fts MATCH ? AND a.deleted_at IS NULL
     ORDER BY rank`,
    [query]
  );
  return rows.map(rowToArticle);
}

export async function moveArticle(id: string, folderId: string | null): Promise<void> {
  const db = getDatabase();
  await db.runAsync('UPDATE articles SET folder_id = ? WHERE id = ?', [folderId, id]);
}

export async function getArticlesByTag(tagId: string): Promise<Article[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT a.* FROM articles a
     JOIN article_tags at ON at.article_id = a.id
     WHERE at.tag_id = ? AND a.deleted_at IS NULL
     ORDER BY a.updated_at DESC`,
    [tagId]
  );
  return rows.map(rowToArticle);
}
