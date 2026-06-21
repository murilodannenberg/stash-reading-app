// ─── Folders ───────────────────────────────────────────────────────────────

export interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// ─── Articles ──────────────────────────────────────────────────────────────

export interface Article {
  id: string;
  folder_id: string | null;
  title: string;
  url: string | null;
  content_html: string | null;
  content_text: string | null;
  author: string | null;
  published_at: string | null;
  cover_image_path: string | null;
  reading_time_min: number | null;
  is_read: boolean;
  is_favorite: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  permanently_deleted_at: string | null;
}

// ─── Files ─────────────────────────────────────────────────────────────────

export type FileType = 'pdf' | 'image' | 'text';

export interface StashFile {
  id: string;
  name: string;
  type: FileType;
  path: string;
  size_bytes: number;
  folder_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// ─── Tags ──────────────────────────────────────────────────────────────────

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

// ─── Highlights ────────────────────────────────────────────────────────────

export interface Highlight {
  id: string;
  article_id: string;
  selected_text: string;
  start_offset: number;
  end_offset: number;
  color: string;
  note: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// ─── Reading Preferences (MMKV) ────────────────────────────────────────────

export interface ReadingPreferences {
  fontSize: number;
  fontFamily: string;
  backgroundColor: string;
  textColor: string;
  lineHeight: number;
}

// ─── App Theme Preferences (MMKV) ─────────────────────────────────────────

export interface AppThemePreferences {
  accentColor: string;
  homeTheme: string;
}

// ─── Navigation ────────────────────────────────────────────────────────────

export type RootStackParamList = {
  MainTabs: undefined;
  Reader: { articleId: string };
  FolderDetail: { folderId: string; folderName: string };
  TagDetail: { tagId: string; tagName: string };
  AddArticle: { folderId?: string; sharedUrl?: string };
  Search: undefined;
  Trash: undefined;
  Highlights: undefined;
};

export type MainTabParamList = {
  Library: undefined;
  Files: undefined;
  Shelves: undefined;
  Tags: undefined;
  Settings: undefined;
};
