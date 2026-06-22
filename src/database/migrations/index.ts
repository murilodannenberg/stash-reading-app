import { SQLiteDatabase } from 'expo-sqlite';
import { up as migration001 } from './001_initial_schema';
import { up as migration002 } from './002_archive_trash';
import { up as migration003 } from './003_folder_icon';
import { up as migration004 } from './004_article_downloaded';
import { up as migration005 } from './005_article_local_html';

interface Migration {
  version: number;
  up: (db: SQLiteDatabase) => Promise<void>;
}

const MIGRATIONS: Migration[] = [
  { version: 1, up: migration001 },
  { version: 2, up: migration002 },
  { version: 3, up: migration003 },
  { version: 4, up: migration004 },
  { version: 5, up: migration005 },
];

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  // Create migrations tracking table if needed
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version    INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
  `);

  const applied = await db.getAllAsync<{ version: number }>(
    'SELECT version FROM _migrations ORDER BY version ASC'
  );
  const appliedVersions = new Set(applied.map((r) => r.version));

  for (const migration of MIGRATIONS) {
    if (!appliedVersions.has(migration.version)) {
      await migration.up(db);
      await db.runAsync(
        'INSERT INTO _migrations (version) VALUES (?)',
        [migration.version]
      );
    }
  }
}
