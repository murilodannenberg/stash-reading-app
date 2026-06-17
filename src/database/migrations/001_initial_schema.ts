import { SQLiteDatabase } from 'expo-sqlite';

export async function up(db: SQLiteDatabase): Promise<void> {
  // ── folders ──────────────────────────────────────────────────────────────
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS folders (
      id         TEXT PRIMARY KEY NOT NULL,
      name       TEXT NOT NULL,
      parent_id  TEXT REFERENCES folders(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      deleted_at TEXT
    );
  `);

  // ── articles ─────────────────────────────────────────────────────────────
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS articles (
      id               TEXT PRIMARY KEY NOT NULL,
      folder_id        TEXT REFERENCES folders(id) ON DELETE SET NULL,
      title            TEXT NOT NULL,
      url              TEXT,
      content_html     TEXT,
      content_text     TEXT,
      author           TEXT,
      published_at     TEXT,
      cover_image_path TEXT,
      reading_time_min INTEGER,
      is_read          INTEGER NOT NULL DEFAULT 0,
      is_favorite      INTEGER NOT NULL DEFAULT 0,
      created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      deleted_at       TEXT
    );
  `);

  // ── files ─────────────────────────────────────────────────────────────────
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS files (
      id         TEXT PRIMARY KEY NOT NULL,
      name       TEXT NOT NULL,
      type       TEXT NOT NULL CHECK(type IN ('pdf', 'image', 'text')),
      path       TEXT NOT NULL,
      size_bytes INTEGER NOT NULL DEFAULT 0,
      folder_id  TEXT REFERENCES folders(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      deleted_at TEXT
    );
  `);

  // ── tags ──────────────────────────────────────────────────────────────────
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS tags (
      id         TEXT PRIMARY KEY NOT NULL,
      name       TEXT NOT NULL UNIQUE,
      color      TEXT NOT NULL DEFAULT '#6366f1',
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
  `);

  // ── article_tags ──────────────────────────────────────────────────────────
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS article_tags (
      article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
      tag_id     TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (article_id, tag_id)
    );
  `);

  // ── file_tags ─────────────────────────────────────────────────────────────
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS file_tags (
      file_id TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
      tag_id  TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (file_id, tag_id)
    );
  `);

  // ── highlights ────────────────────────────────────────────────────────────
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS highlights (
      id            TEXT PRIMARY KEY NOT NULL,
      article_id    TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
      selected_text TEXT NOT NULL,
      start_offset  INTEGER NOT NULL,
      end_offset    INTEGER NOT NULL,
      color         TEXT NOT NULL DEFAULT '#fde047',
      note          TEXT,
      created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      deleted_at    TEXT
    );
  `);

  // ── highlight_tags ────────────────────────────────────────────────────────
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS highlight_tags (
      highlight_id TEXT NOT NULL REFERENCES highlights(id) ON DELETE CASCADE,
      tag_id       TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (highlight_id, tag_id)
    );
  `);

  // ── FTS5 virtual table ────────────────────────────────────────────────────
  await db.execAsync(`
    CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts
    USING fts5(
      title,
      content_text,
      content='articles',
      content_rowid='rowid'
    );
  `);

  // ── Triggers: keep articles_fts in sync ──────────────────────────────────
  await db.execAsync(`
    CREATE TRIGGER IF NOT EXISTS articles_ai AFTER INSERT ON articles BEGIN
      INSERT INTO articles_fts(rowid, title, content_text)
      VALUES (new.rowid, new.title, new.content_text);
    END;
  `);
  await db.execAsync(`
    CREATE TRIGGER IF NOT EXISTS articles_ad AFTER DELETE ON articles BEGIN
      INSERT INTO articles_fts(articles_fts, rowid, title, content_text)
      VALUES ('delete', old.rowid, old.title, old.content_text);
    END;
  `);
  await db.execAsync(`
    CREATE TRIGGER IF NOT EXISTS articles_au AFTER UPDATE ON articles BEGIN
      INSERT INTO articles_fts(articles_fts, rowid, title, content_text)
      VALUES ('delete', old.rowid, old.title, old.content_text);
      INSERT INTO articles_fts(rowid, title, content_text)
      VALUES (new.rowid, new.title, new.content_text);
    END;
  `);

  // ── Triggers: auto-update updated_at ──────────────────────────────────────
  for (const table of ['folders', 'articles', 'files', 'tags', 'highlights']) {
    await db.execAsync(`
      CREATE TRIGGER IF NOT EXISTS ${table}_updated_at
      AFTER UPDATE ON ${table}
      FOR EACH ROW
      WHEN old.updated_at = new.updated_at
      BEGIN
        UPDATE ${table}
        SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE id = new.id;
      END;
    `);
  }

  // ── Indexes ───────────────────────────────────────────────────────────────
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_articles_folder   ON articles(folder_id, deleted_at);
    CREATE INDEX IF NOT EXISTS idx_articles_updated  ON articles(updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_articles_favorite ON articles(is_favorite) WHERE is_favorite = 1;
    CREATE INDEX IF NOT EXISTS idx_files_folder      ON files(folder_id, deleted_at);
    CREATE INDEX IF NOT EXISTS idx_highlights_article ON highlights(article_id, deleted_at);
    CREATE INDEX IF NOT EXISTS idx_folders_parent    ON folders(parent_id, deleted_at);
    CREATE INDEX IF NOT EXISTS idx_article_tags_tag  ON article_tags(tag_id);
    CREATE INDEX IF NOT EXISTS idx_file_tags_tag     ON file_tags(tag_id);
    CREATE INDEX IF NOT EXISTS idx_highlight_tags_tag ON highlight_tags(tag_id);
  `);
}
