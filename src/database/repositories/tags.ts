import { getDatabase } from '../connection';
import { Tag } from '../../types';
import { generateId, nowISO } from '../../utils/id';

export async function getTags(): Promise<Tag[]> {
  const db = getDatabase();
  return db.getAllAsync<Tag>('SELECT * FROM tags ORDER BY name ASC');
}

export async function getTagById(id: string): Promise<Tag | null> {
  const db = getDatabase();
  return db.getFirstAsync<Tag>('SELECT * FROM tags WHERE id = ?', [id]);
}

export async function createTag(name: string, color: string = '#6366f1'): Promise<Tag> {
  const db = getDatabase();
  const id = generateId();
  const now = nowISO();
  await db.runAsync(
    'INSERT INTO tags (id, name, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    [id, name, color, now, now]
  );
  return { id, name, color, created_at: now, updated_at: now };
}

export async function updateTag(id: string, name: string, color: string): Promise<void> {
  const db = getDatabase();
  await db.runAsync('UPDATE tags SET name = ?, color = ? WHERE id = ?', [name, color, id]);
}

export async function deleteTag(id: string): Promise<void> {
  const db = getDatabase();
  // Cascades to article_tags, file_tags, highlight_tags via FK
  await db.runAsync('DELETE FROM tags WHERE id = ?', [id]);
}

export async function getTagsForArticle(articleId: string): Promise<Tag[]> {
  const db = getDatabase();
  return db.getAllAsync<Tag>(
    `SELECT t.* FROM tags t
     JOIN article_tags at ON at.tag_id = t.id
     WHERE at.article_id = ?
     ORDER BY t.name ASC`,
    [articleId]
  );
}

export async function setTagsForArticle(articleId: string, tagIds: string[]): Promise<void> {
  const db = getDatabase();
  await db.runAsync('DELETE FROM article_tags WHERE article_id = ?', [articleId]);
  for (const tagId of tagIds) {
    await db.runAsync(
      'INSERT OR IGNORE INTO article_tags (article_id, tag_id) VALUES (?, ?)',
      [articleId, tagId]
    );
  }
}

export async function getTagsForFile(fileId: string): Promise<Tag[]> {
  const db = getDatabase();
  return db.getAllAsync<Tag>(
    `SELECT t.* FROM tags t
     JOIN file_tags ft ON ft.tag_id = t.id
     WHERE ft.file_id = ?
     ORDER BY t.name ASC`,
    [fileId]
  );
}

export async function setTagsForFile(fileId: string, tagIds: string[]): Promise<void> {
  const db = getDatabase();
  await db.runAsync('DELETE FROM file_tags WHERE file_id = ?', [fileId]);
  for (const tagId of tagIds) {
    await db.runAsync(
      'INSERT OR IGNORE INTO file_tags (file_id, tag_id) VALUES (?, ?)',
      [fileId, tagId]
    );
  }
}
