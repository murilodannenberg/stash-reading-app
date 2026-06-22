import { SQLiteDatabase } from 'expo-sqlite';

export async function up(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    ALTER TABLE articles ADD COLUMN is_downloaded INTEGER NOT NULL DEFAULT 0;
  `);
}
