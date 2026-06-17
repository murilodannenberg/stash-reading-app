import { getDatabase } from '../connection';
import { Folder } from '../../types';
import { generateId, nowISO } from '../../utils/id';

export async function getFolders(parentId: string | null = null): Promise<Folder[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<Folder>(
    `SELECT * FROM folders
     WHERE deleted_at IS NULL AND parent_id IS ?
     ORDER BY name ASC`,
    [parentId]
  );
  return rows;
}

export async function getFolderById(id: string): Promise<Folder | null> {
  const db = getDatabase();
  return db.getFirstAsync<Folder>(
    'SELECT * FROM folders WHERE id = ? AND deleted_at IS NULL',
    [id]
  );
}

export async function createFolder(name: string, parentId: string | null = null): Promise<Folder> {
  const db = getDatabase();
  const id = generateId();
  const now = nowISO();
  await db.runAsync(
    `INSERT INTO folders (id, name, parent_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, name, parentId, now, now]
  );
  return { id, name, parent_id: parentId, created_at: now, updated_at: now, deleted_at: null };
}

export async function updateFolder(id: string, name: string): Promise<void> {
  const db = getDatabase();
  await db.runAsync('UPDATE folders SET name = ? WHERE id = ?', [name, id]);
}

export async function deleteFolder(id: string): Promise<void> {
  const db = getDatabase();
  const now = nowISO();
  await db.runAsync(
    'UPDATE folders SET deleted_at = ?, updated_at = ? WHERE id = ?',
    [now, now, id]
  );
}
