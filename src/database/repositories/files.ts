import * as FileSystem from 'expo-file-system';
import { File, Directory, Paths } from 'expo-file-system';
import { getDatabase } from '../connection';
import { StashFile, FileType } from '../../types';
import { generateId, nowISO } from '../../utils/id';

function getFilesDir(): Directory {
  const dir = new Directory(Paths.document, 'files');
  if (!dir.exists) dir.create();
  return dir;
}

/** Copy a picked file into app-local storage and return its persistent URI. */
export async function copyFileToStorage(
  sourceUri: string,
  fileName: string,
): Promise<string> {
  const filesDir = getFilesDir();

  // Sanitize: keep extension intact, replace special chars in base name
  const lastDot = fileName.lastIndexOf('.');
  const ext = lastDot !== -1 ? fileName.slice(lastDot) : '';
  const base = lastDot !== -1 ? fileName.slice(0, lastDot) : fileName;
  const safeName = base.replace(/[^\w-]/g, '_') + ext;

  // Use v2 File API for path construction (handles URI encoding correctly)
  const candidate = new File(filesDir, safeName);
  const finalName = candidate.exists ? `${Date.now()}_${safeName}` : safeName;
  const destFile = new File(filesDir, finalName);

  await FileSystem.copyAsync({ from: sourceUri, to: destFile.uri });
  return destFile.uri;
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
