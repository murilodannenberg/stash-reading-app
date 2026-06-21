import { File, Directory, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDatabase, closeDatabase, openDatabase } from '../database/connection';

const BACKUP_FILENAME = 'stash_backup.db';

function getDbFile(): File {
  const sqliteDir = new Directory(Paths.document, 'SQLite');
  return new File(sqliteDir, 'stash.db');
}

function getTempFile(): File {
  return new File(Paths.cache, BACKUP_FILENAME);
}

export async function exportBackup(): Promise<void> {
  // Flush WAL → garante arquivo .db completo antes de copiar
  const db = getDatabase();
  await db.execAsync('PRAGMA wal_checkpoint(TRUNCATE);');

  const temp = getTempFile();
  await getDbFile().copy(temp, { overwrite: true });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Compartilhamento não disponível neste dispositivo.');
  }

  await Sharing.shareAsync(temp.uri, {
    mimeType: 'application/octet-stream',
    dialogTitle: 'Salvar backup do Stash',
  });
}

export async function importBackup(): Promise<'canceled' | 'ok'> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['*/*'],
    copyToCacheDirectory: true,
  });

  if (result.canceled) return 'canceled';
  const picked = new File(result.assets[0].uri);

  await closeDatabase();

  try {
    const sqliteDir = new Directory(Paths.document, 'SQLite');
    if (!sqliteDir.exists) {
      sqliteDir.create();
    }

    await picked.copy(getDbFile(), { overwrite: true });
  } catch (e) {
    // Garante que o banco reabre mesmo se a cópia falhar
    await openDatabase();
    throw e;
  }

  await openDatabase();
  return 'ok';
}
