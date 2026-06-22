import { SQLiteDatabase } from 'expo-sqlite';

// Stores the offline (localized) HTML separately so the original content_html with
// remote image URLs is preserved — letting a download be removed and reverted cleanly.
export async function up(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    ALTER TABLE articles ADD COLUMN content_html_local TEXT;
  `);
}
