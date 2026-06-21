import { SQLiteDatabase } from 'expo-sqlite';

export async function up(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    ALTER TABLE folders ADD COLUMN icon TEXT NOT NULL DEFAULT 'books';
  `);
}
