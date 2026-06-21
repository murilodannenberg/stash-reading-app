import { SQLiteDatabase } from 'expo-sqlite';

export async function up(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    ALTER TABLE articles ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE articles ADD COLUMN permanently_deleted_at TEXT;
  `);
}
