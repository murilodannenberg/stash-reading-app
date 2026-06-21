import * as FileSystem from 'expo-file-system';
import { Directory, Paths } from 'expo-file-system';
import { getDatabase } from '../connection';
import { StashFile, FileType } from '../../types';
import { generateId, nowISO } from '../../utils/id';

const FILES_DIR = new Directory(Paths.document, 'files');

function ensureFilesDir() {
  if (!FILES_DIR.exists) FILES_DIR.create();
}

/** Copy a picked file into app-local storage and return its persistent URI. */
export async function copyFileToStorage(
  sourceUri: string,
  fileName: string,
): Promise<string> {
  ensureFilesDir();
  const baseUri = FILES_DIR.uri;
  const candidate = baseUri + fileName;
  // If a file with the same name already exists, suffix with a timestamp
  const destUri = (await FileSystem.getInfoAsync(candidate)).exists
    ? baseUri + `${Date.now()}_${fileName}`
    : candidate;
  await FileSystem.copyAsync({ from: sourceUri, to: destUri });
  return destUri;
}

export async function deleteFileFromStorage(localUri: string): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(localUri);
    if (info.exists) await FileSystem.deleteAsync(localUri, { idempotent: true });
  } catch {
    // ignore
  }
}

// ─── DB operations ───────────────────────────────────────────────────────────

export async function getFiles(folderId?: string | null): Promise<StashFile[]> {
  const db = getDatabase();
  if (folderId !== undefined) {
    return db.getAllAsync<StashFile>(
      `SELECT * FROM files WHERE deleted_at IS NULL AND folder_id ${folderId ? '= ?' : 'IS NULL'} ORDER BY created_at DESC`,
      folderId ? [folderId] : [],
    );
  }
  return db.getAllAsync<StashFile>(
    'SELECT * FROM files WHERE deleted_at IS NULL ORDER BY created_at DESC',
  );
}

export async function createFile(params: {
  name: string;
  type: FileType;
  path: string;
  size_bytes: number;
  folder_id: string | null;
}): Promise<StashFile> {
  const db = getDatabase();
  const id = generateId();
  const now = nowISO();
  await db.runAsync(
    'INSERT INTO files (id, name, type, path, size_bytes, folder_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, params.name, params.type, params.path, params.size_bytes, params.folder_id, now, now],
  );
  return { id, ...params, created_at: now, updated_at: now, deleted_at: null };
}

export async function deleteFile(id: string): Promise<void> {
  const db = getDatabase();
  await db.runAsync('UPDATE files SET deleted_at = ? WHERE id = ?', [nowISO(), id]);
}
